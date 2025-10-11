# MESH LLM Two-Tier Feedback Loop Implementation

## Overview

This document outlines the phased implementation of a two-tier AI learning system that transforms departmental AI assistants from reactive Q&A tools into a proactive, self-improving intelligence platform.

## Architecture Vision

```
┌─────────────────────────────────────────────┐
│     Centralized Knowledge Base              │
│  ┌──────────────────────────────────────┐  │
│  │ • Documents, Policies, Best Practices│  │
│  │ • Cross-department Insights          │  │
│  │ • Innovation Patterns                │  │
│  │ • Lessons Learned                    │  │
│  └──────────────────────────────────────┘  │
└───────────────┬─────────────────────────────┘
                │ (Shared RLS-protected access)
        ┌───────┴───────┬───────────┬──────────┐
        ▼               ▼           ▼          ▼
   ┌────────┐     ┌────────┐  ┌────────┐  ┌────────┐
   │ HR     │     │Finance │  │  IT    │  │ Sales  │
   │ Agent  │     │ Agent  │  │ Agent  │  │ Agent  │
   └────┬───┘     └────┬───┘  └────┬───┘  └────┬───┘
        │              │           │           │
        └──────────────┴───────────┴───────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Central MML   │
              │    Cluster     │
              │                │
              │ • Aggregates   │
              │ • Analyzes     │
              │ • Innovates    │
              └────────────────┘
```

## Implementation Phases

### Phase 1: ✅ Departmental Layer (COMPLETE)

**Status**: Already implemented

**Components**:
- ✅ Departmental AI assistants (HR, IT, Finance, Sales, Operations, Executive)
- ✅ Knowledge base with RLS-protected department access
- ✅ Conversation history tracking
- ✅ Department-specific LLM configurations
- ✅ Real-time chat interface per department

**Tables**:
- `department_llm_config` - Department AI configurations
- `knowledge_articles` - Shared knowledge base
- `conversation_history` - Chat logs

**Edge Function**:
- `department-assistant` - Handles department-specific AI queries

---

### Phase 2: Insight Aggregation (NEXT)

**Goal**: Enable departmental LLMs to learn from interactions and generate insights

**New Database Tables**:

```sql
-- Department-level insights generated from user interactions
CREATE TABLE department_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  department TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'pattern', 'bottleneck', 'opportunity', 'risk'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  impact_score INTEGER, -- 1-10
  supporting_interactions UUID[], -- Array of conversation_history IDs
  affected_users INTEGER DEFAULT 0,
  frequency_count INTEGER DEFAULT 1,
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new', -- 'new', 'acknowledged', 'acted_upon', 'dismissed'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which insights have been promoted to knowledge articles
CREATE TABLE insight_to_article (
  insight_id UUID REFERENCES department_insights(id),
  article_id UUID REFERENCES knowledge_articles(id),
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  promoted_by UUID,
  PRIMARY KEY (insight_id, article_id)
);
```

**Edge Function Enhancement**:
- Modify `department-assistant` to detect patterns after N interactions
- Generate insights based on:
  - Repeated questions (knowledge gaps)
  - Common pain points (bottlenecks)
  - Successful solutions (best practices)
  - User satisfaction trends

**Success Criteria**:
- Departments generate 3-5 insights per day
- 80%+ confidence scores on validated insights
- Insights can be manually promoted to knowledge articles

---

### Phase 3: Central MML Engine

**Goal**: Create an organization-wide intelligence layer that identifies cross-department patterns

**New Database Tables**:

```sql
-- Global insights from cross-department analysis
CREATE TABLE global_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'cross_dept_pattern', 'org_trend', 'innovation_opportunity'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_departments TEXT[], -- ['HR', 'IT', 'Finance']
  source_insights UUID[], -- Department insights that contributed
  confidence_score NUMERIC(3,2),
  impact_score INTEGER,
  actionable_recommendations JSONB,
  roi_estimate NUMERIC,
  implementation_complexity TEXT, -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'new',
  acted_upon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track cross-department correlations
CREATE TABLE insight_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  dept_1 TEXT NOT NULL,
  dept_2 TEXT NOT NULL,
  correlation_type TEXT NOT NULL, -- 'positive', 'negative', 'causal'
  strength NUMERIC(3,2), -- correlation strength
  insight_1_id UUID REFERENCES department_insights(id),
  insight_2_id UUID REFERENCES department_insights(id),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  evidence JSONB
);
```

**New Edge Function**:

```typescript
// supabase/functions/central-mml-processor/index.ts
// Scheduled via pg_cron (runs every 6 hours)
// 
// Responsibilities:
// 1. Aggregate new department insights
// 2. Identify cross-department patterns
// 3. Calculate correlations (e.g., "IT ticket spike → Sales close rate drop")
// 4. Generate organization-wide recommendations
// 5. Create actionable global insights
```

**Scheduled Execution**:
```sql
-- Run every 6 hours
SELECT cron.schedule(
  'central-mml-analysis',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://olrpexessehcijdvogxo.supabase.co/functions/v1/central-mml-processor',
    headers:='{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);
```

**Success Criteria**:
- Identify 2-3 meaningful cross-department patterns per week
- Generate actionable recommendations with ROI estimates
- 70%+ accuracy on correlation predictions

---

### Phase 4: Feedback Distribution

**Goal**: Close the loop by feeding global insights back to departmental LLMs

**Enhancements to Department Assistants**:

1. **Proactive Recommendations**:
   - Query `global_insights` table for relevant patterns
   - Surface recommendations in chat context
   - "Based on organization-wide trends, consider..."

2. **Context Enhancement**:
   - Include cross-department learnings in system prompt
   - "IT has found that X approach reduces Y by Z%"

3. **Knowledge Creation**:
   - Auto-generate draft knowledge articles from high-confidence insights
   - Suggest documentation improvements

**New Database Tables**:

```sql
-- Track insight adoption and effectiveness
CREATE TABLE insight_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID, -- References department_insights OR global_insights
  insight_type TEXT NOT NULL, -- 'department' or 'global'
  user_id UUID NOT NULL,
  department TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- 'helpful', 'not_helpful', 'implemented', 'dismissed'
  feedback_notes TEXT,
  before_metric NUMERIC,
  after_metric NUMERIC,
  roi_realized NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Edge Function Enhancement**:
```typescript
// Modify department-assistant to:
// 1. Query global_insights for proactive recommendations
// 2. Include cross-department context in prompts
// 3. Track when insights are surfaced to users
// 4. Collect feedback on insight helpfulness
```

**Success Criteria**:
- 60%+ of users find cross-department insights helpful
- 20%+ of recommendations are implemented
- Measurable improvement in key metrics (time to resolution, process efficiency, etc.)

---

## Benefits at Each Phase

### Phase 2 Benefits:
- Departments identify their own patterns and improvement areas
- Reduced repetitive questions via automated knowledge creation
- Data-driven understanding of department needs

### Phase 3 Benefits:
- Organization-wide visibility into systemic issues
- Identify dependencies and correlations across departments
- Prioritize initiatives based on cross-functional impact

### Phase 4 Benefits:
- Departments benefit from other departments' learnings
- Proactive problem prevention
- Continuous improvement culture
- Measurable ROI on AI implementation

---

## Technical Considerations

### Security & Privacy:
- All insights respect RLS policies
- Department-specific insights only visible to that department
- Global insights show correlations without exposing sensitive details
- Admin-only access to full correlation data

### Performance:
- Central MML runs on schedule (not real-time) to avoid load
- Insight generation is async and non-blocking
- Caching of frequently accessed insights

### Cost Management:
- Batch processing to minimize AI API calls
- Confidence thresholds to avoid low-quality insights
- Rate limiting on insight generation

### Monitoring:
- Track insight generation rate per department
- Monitor false positive rate
- Measure user feedback and adoption

---

## Rollback Strategy

Each phase can be independently disabled:
- **Phase 2**: Stop insight generation, existing insights remain
- **Phase 3**: Pause cron job, no new global insights
- **Phase 4**: Remove global context from departmental prompts

---

## Success Metrics

### Phase 2:
- Insights generated per department per week
- Insight confidence scores
- Insights promoted to knowledge articles

### Phase 3:
- Cross-department patterns identified
- Correlation accuracy rate
- Global recommendations generated

### Phase 4:
- User adoption rate (% who act on recommendations)
- Measured ROI on implemented insights
- Reduction in repeat issues
- Improvement in key performance indicators

---

## Next Steps

1. **Immediate**: Implement Phase 2 (Insight Aggregation)
2. **Week 2-3**: Test and validate department insight generation
3. **Week 4**: Implement Phase 3 (Central MML Engine)
4. **Week 5-6**: Monitor and tune correlation detection
5. **Week 7**: Implement Phase 4 (Feedback Distribution)
6. **Week 8+**: Measure impact and iterate

---

## Related Documentation

- [MESH LLM Architecture](./ARCHITECTURE.md)
- [Department AI Assistant Guide](./DEVELOPER_HANDOFF.md)
- [Knowledge Base Integration](./DOCUMENTATION_INDEX.md)
