import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { feedId } = await req.json();

    // Get feed configuration
    const { data: feed, error: feedError } = await supabase
      .from('threat_intel_feeds')
      .select('*')
      .eq('id', feedId)
      .single();

    if (feedError) throw feedError;

    console.log(`Syncing threat intel feed: ${feed.feed_name}`);

    let indicators = [];

    // Sync from different sources
    switch (feed.feed_source) {
      case 'alienvault':
        indicators = await syncAlienVault(feed);
        break;
      case 'abuseipdb':
        indicators = await syncAbuseIPDB(feed);
        break;
      case 'urlhaus':
        indicators = await syncURLhaus();
        break;
      case 'threatfox':
        indicators = await syncThreatFox();
        break;
      default:
        throw new Error(`Unsupported feed source: ${feed.feed_source}`);
    }

    // Insert indicators into database
    const indicatorsWithCustomerId = indicators.map(ind => ({
      ...ind,
      customer_id: feed.customer_id,
      feed_id: feed.id,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_active: true
    }));

    // Batch insert (upsert based on indicator value)
    for (let i = 0; i < indicatorsWithCustomerId.length; i += 100) {
      const batch = indicatorsWithCustomerId.slice(i, i + 100);
      
      const { error: insertError } = await supabase
        .from('threat_intel_indicators')
        .upsert(batch, {
          onConflict: 'customer_id,indicator_value',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error inserting batch:', insertError);
      }
    }

    // Update feed metadata
    await supabase
      .from('threat_intel_feeds')
      .update({
        last_updated: new Date().toISOString(),
        last_sync_status: 'success',
        indicator_count: indicators.length
      })
      .eq('id', feedId);

    console.log(`Successfully synced ${indicators.length} indicators from ${feed.feed_name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        indicators_synced: indicators.length,
        feed_name: feed.feed_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing threat intel:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// AlienVault OTX - Free threat intelligence
async function syncAlienVault(feed: any) {
  const indicators = [];
  
  try {
    // Use AlienVault OTX Public Pulses API
    const response = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
      headers: {
        'X-OTX-API-KEY': feed.api_key || 'public'
      }
    });

    const data = await response.json();
    
    for (const pulse of data.results.slice(0, 50)) {
      for (const indicator of pulse.indicators) {
        indicators.push({
          indicator_type: mapIndicatorType(indicator.type),
          indicator_value: indicator.indicator,
          threat_type: pulse.tags?.[0] || 'unknown',
          severity: mapSeverity(pulse.TLP),
          confidence_score: 75,
          metadata: {
            pulse_name: pulse.name,
            description: pulse.description,
            tags: pulse.tags
          }
        });
      }
    }
  } catch (error) {
    console.error('AlienVault sync error:', error);
  }

  return indicators;
}

// AbuseIPDB - IP reputation feed
async function syncAbuseIPDB(feed: any) {
  const indicators = [];
  
  try {
    const response = await fetch('https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=75', {
      headers: {
        'Key': feed.api_key,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    for (const ip of data.data) {
      indicators.push({
        indicator_type: 'ip',
        indicator_value: ip.ipAddress,
        threat_type: 'malicious_ip',
        severity: ip.abuseConfidenceScore > 90 ? 'high' : 'medium',
        confidence_score: ip.abuseConfidenceScore,
        metadata: {
          country_code: ip.countryCode,
          usage_type: ip.usageType,
          total_reports: ip.totalReports
        }
      });
    }
  } catch (error) {
    console.error('AbuseIPDB sync error:', error);
  }

  return indicators;
}

// URLhaus - Malware URL database (public, no API key needed)
async function syncURLhaus() {
  const indicators = [];
  
  try {
    const response = await fetch('https://urlhaus.abuse.ch/downloads/csv_recent/');
    const csv = await response.text();
    const lines = csv.split('\n').slice(9); // Skip header comments
    
    for (const line of lines.slice(0, 1000)) {
      if (line.startsWith('#') || !line.trim()) continue;
      
      const parts = line.split(',');
      if (parts.length < 7) continue;
      
      indicators.push({
        indicator_type: 'url',
        indicator_value: parts[2]?.replace(/"/g, ''),
        threat_type: parts[4]?.replace(/"/g, '') || 'malware',
        severity: 'high',
        confidence_score: 85,
        metadata: {
          malware_family: parts[5]?.replace(/"/g, ''),
          tags: parts[6]?.replace(/"/g, '')
        }
      });
    }
  } catch (error) {
    console.error('URLhaus sync error:', error);
  }

  return indicators;
}

// ThreatFox - IOC database (public, no API key needed)
async function syncThreatFox() {
  const indicators = [];
  
  try {
    const response = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'get_iocs', days: 7 })
    });

    const data = await response.json();
    
    for (const ioc of data.data || []) {
      indicators.push({
        indicator_type: mapThreatFoxType(ioc.ioc_type),
        indicator_value: ioc.ioc,
        threat_type: ioc.malware,
        severity: ioc.confidence_level > 75 ? 'high' : 'medium',
        confidence_score: ioc.confidence_level,
        metadata: {
          malware_family: ioc.malware_printable,
          tags: ioc.tags
        }
      });
    }
  } catch (error) {
    console.error('ThreatFox sync error:', error);
  }

  return indicators;
}

function mapIndicatorType(type: string): string {
  const typeMap: Record<string, string> = {
    'IPv4': 'ip',
    'IPv6': 'ip',
    'domain': 'domain',
    'hostname': 'domain',
    'URL': 'url',
    'FileHash-MD5': 'file_hash',
    'FileHash-SHA1': 'file_hash',
    'FileHash-SHA256': 'file_hash',
    'email': 'email',
    'CVE': 'cve'
  };
  return typeMap[type] || 'unknown';
}

function mapThreatFoxType(type: string): string {
  const typeMap: Record<string, string> = {
    'ip:port': 'ip',
    'domain': 'domain',
    'url': 'url',
    'md5_hash': 'file_hash',
    'sha256_hash': 'file_hash'
  };
  return typeMap[type] || 'unknown';
}

function mapSeverity(tlp: string): string {
  const severityMap: Record<string, string> = {
    'white': 'low',
    'green': 'medium',
    'amber': 'high',
    'red': 'critical'
  };
  return severityMap[tlp?.toLowerCase()] || 'medium';
}