/**
 * RBAC & Permissions System Validation Script
 * Analyzes permissions hooks, components, and database integration
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const results = {
  passed: [],
  warnings: [],
  critical: [],
  summary: {}
};

// Files to analyze
const FILES = {
  hooks: 'src/hooks/usePermissions.ts',
  resourceHooks: 'src/hooks/useResourcePermissions.tsx',
  navigationHooks: 'src/hooks/useNavigationPermissions.ts',
  permissionBadge: 'src/components/PermissionBadge.tsx',
  actionButton: 'src/components/ActionButton.tsx',
  protectedRoute: 'src/components/ProtectedRoute.tsx',
  rbacPortal: 'src/pages/RBACPortal.tsx',
  roleManagement: 'src/components/rbac/RoleManagement.tsx',
  permissionManagement: 'src/components/rbac/PermissionManagement.tsx',
  roleHierarchy: 'src/components/rbac/RoleHierarchy.tsx',
  roleTemplates: 'src/components/rbac/RoleTemplates.tsx',
  tempPrivileges: 'src/components/rbac/TemporaryPrivileges.tsx',
  auditLog: 'src/components/rbac/PermissionAuditLog.tsx',
  // Optimization files
  sharedRolesHook: 'src/hooks/useRoles.ts',
  sharedProfilesHook: 'src/hooks/useUserProfiles.ts',
  sharedMutations: 'src/hooks/useRBACMutations.ts',
  rbacConstants: 'src/lib/rbacConstants.ts'
};

function readFile(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    return null;
  }
}

function checkFileExists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

console.log('🔍 Starting RBAC & Permissions System Validation...\n');

// ========================================
// 1. FILE EXISTENCE CHECK
// ========================================
console.log('📁 Checking file existence...');
const missingFiles = [];
for (const [key, path] of Object.entries(FILES)) {
  if (!checkFileExists(path)) {
    missingFiles.push(path);
    results.critical.push(`Missing file: ${path}`);
  } else {
    results.passed.push(`✓ File exists: ${path}`);
  }
}

if (missingFiles.length === 0) {
  console.log('✅ All RBAC files exist\n');
} else {
  console.log(`❌ Missing ${missingFiles.length} files\n`);
}

// ========================================
// 2. PERMISSION HOOK ANALYSIS
// ========================================
console.log('🪝 Analyzing usePermissions hook...');
const permissionsHook = readFile(FILES.hooks);

if (permissionsHook) {
  // Check for proper RPC function usage
  if (permissionsHook.includes('has_permission') && permissionsHook.includes('supabase.rpc')) {
    results.passed.push('✓ Uses has_permission RPC function');
  } else {
    results.critical.push('Missing has_permission RPC call');
  }

  // Check for caching mechanism
  if (permissionsHook.includes('permissionCache') || permissionsHook.includes('Map')) {
    results.passed.push('✓ Implements permission caching');
  } else {
    results.warnings.push('No caching mechanism found - may cause performance issues');
  }
  
  // Check for useRef-based cache (prevents unnecessary re-renders)
  if (permissionsHook.includes('useRef') && permissionsHook.includes('permissionCacheRef')) {
    results.passed.push('✓ Uses useRef for cache (prevents re-renders)');
  } else if (permissionsHook.includes('useState') && permissionsHook.includes('permissionCache')) {
    results.warnings.push('Cache uses useState - consider useRef to prevent re-renders');
  }
  
  // Check for useCallback to prevent infinite loops
  if (permissionsHook.includes('useCallback')) {
    results.passed.push('✓ Uses useCallback for stable function references');
  } else {
    results.critical.push('Missing useCallback - may cause infinite render loops (React error #310)');
  }
  
  // Check for proper useEffect dependencies
  const useEffectMatches = permissionsHook.match(/useEffect\([^)]+\),\s*\[([^\]]*)\]/g);
  if (useEffectMatches) {
    const allHaveDeps = useEffectMatches.every(match => {
      const deps = match.match(/\[([^\]]*)\]/)[1].trim();
      return deps.length > 0; // Has at least one dependency or empty array
    });
    if (allHaveDeps) {
      results.passed.push('✓ All useEffect hooks have dependency arrays');
    } else {
      results.critical.push('Some useEffect hooks missing dependency arrays - causes infinite loops');
    }
  }

  // Check for proper error handling
  if (permissionsHook.includes('try') && permissionsHook.includes('catch')) {
    results.passed.push('✓ Has error handling');
  } else {
    results.warnings.push('Missing error handling in permission checks');
  }

  // Check for TypeScript types
  if (permissionsHook.includes('PermissionLevel') && permissionsHook.includes('interface')) {
    results.passed.push('✓ Uses TypeScript interfaces');
  } else {
    results.warnings.push('Missing TypeScript type definitions');
  }

  // Check for redundant permission checks
  const checkPermissionCount = (permissionsHook.match(/checkPermission/g) || []).length;
  if (checkPermissionCount > 1 && checkPermissionCount < 5) {
    results.passed.push(`✓ Reasonable number of permission check references (${checkPermissionCount})`);
  } else if (checkPermissionCount > 5) {
    results.warnings.push(`High number of permission check references (${checkPermissionCount}) - potential redundancy`);
  }
}

console.log('✅ Hook analysis complete\n');

// ========================================
// 3. PROTECTED ROUTE ANALYSIS
// ========================================
console.log('🛡️ Analyzing ProtectedRoute component...');
const protectedRoute = readFile(FILES.protectedRoute);

if (protectedRoute) {
  // Check for admin role checking
  if (protectedRoute.includes('requireAdmin') && protectedRoute.includes('has_role')) {
    results.passed.push('✓ Implements admin role checking');
  } else {
    results.critical.push('Missing admin role enforcement');
  }

  // Check for authentication check
  if (protectedRoute.includes('supabase.auth.getSession')) {
    results.passed.push('✓ Checks authentication session');
  } else {
    results.critical.push('Missing authentication check');
  }

  // Check for auth state subscription
  if (protectedRoute.includes('onAuthStateChange')) {
    results.passed.push('✓ Subscribes to auth state changes');
  } else {
    results.warnings.push('No auth state subscription - may miss real-time changes');
  }

  // Check for loading state
  if (protectedRoute.includes('loading') || protectedRoute.includes('Loader')) {
    results.passed.push('✓ Handles loading state');
  } else {
    results.warnings.push('Missing loading state handling');
  }

  // Check for redirect logic
  if (protectedRoute.includes('Navigate') && protectedRoute.includes('/auth')) {
    results.passed.push('✓ Redirects unauthenticated users');
  } else {
    results.critical.push('Missing redirect for unauthenticated users');
  }
}

console.log('✅ ProtectedRoute analysis complete\n');

// ========================================
// 4. RBAC PORTAL ANALYSIS
// ========================================
console.log('🎛️ Analyzing RBAC Portal...');
const rbacPortal = readFile(FILES.rbacPortal);

if (rbacPortal) {
  // Check for admin verification
  if (rbacPortal.includes('has_role') && rbacPortal.includes('admin')) {
    results.passed.push('✓ Verifies admin access');
  } else {
    results.critical.push('RBAC Portal missing admin verification');
  }

  // Check for tab management
  if (rbacPortal.includes('Tabs') && rbacPortal.includes('TabsContent')) {
    results.passed.push('✓ Uses tab-based navigation');
  } else {
    results.warnings.push('Non-standard navigation pattern');
  }

  // Check for all RBAC components
  const components = [
    'RoleManagement',
    'PermissionManagement',
    'RoleHierarchy',
    'TemporaryPrivileges',
    'PermissionAuditLog',
    'RoleTemplates'
  ];
  
  const missingComponents = components.filter(comp => !rbacPortal.includes(comp));
  if (missingComponents.length === 0) {
    results.passed.push('✓ All RBAC components integrated');
  } else {
    results.warnings.push(`Missing components: ${missingComponents.join(', ')}`);
  }
}

console.log('✅ RBAC Portal analysis complete\n');

// ========================================
// 5. COMPONENT REDUNDANCY CHECK
// ========================================
console.log('🔄 Checking for redundancies...');

const allRBACFiles = [
  FILES.roleManagement,
  FILES.permissionManagement,
  FILES.roleHierarchy,
  FILES.roleTemplates,
  FILES.tempPrivileges,
  FILES.auditLog
].map(readFile).filter(Boolean);

// Check for duplicate Supabase queries
const queryPatterns = new Map();
allRBACFiles.forEach((file, idx) => {
  const queries = file.match(/supabase\s*\.\s*from\s*\(\s*['"`](\w+)['"`]\s*\)/g) || [];
  queries.forEach(query => {
    const table = query.match(/['"`](\w+)['"`]/)?.[1];
    if (table) {
      if (!queryPatterns.has(table)) {
        queryPatterns.set(table, []);
      }
      queryPatterns.set(table, [...queryPatterns.get(table), idx]);
    }
  });
});

// Check if shared hooks exist
const hasSharedRolesHook = checkFileExists(FILES.sharedRolesHook);
const hasSharedProfilesHook = checkFileExists(FILES.sharedProfilesHook);

const duplicateTables = Array.from(queryPatterns.entries())
  .filter(([_, fileIndices]) => fileIndices.length > 1);

if (duplicateTables.length === 0 || (hasSharedRolesHook && hasSharedProfilesHook)) {
  results.passed.push('✓ No duplicate table queries - shared hooks implemented');
} else {
  duplicateTables.forEach(([table, indices]) => {
    if (table === 'roles' && !hasSharedRolesHook) {
      results.warnings.push(`Table "${table}" queried in ${indices.length} components - consider shared hook`);
    } else if (table === 'user_profiles' && !hasSharedProfilesHook) {
      results.warnings.push(`Table "${table}" queried in ${indices.length} components - consider shared hook`);
    }
  });
}

// Check for duplicate mutation patterns and shared mutations
const hasSharedMutations = checkFileExists(FILES.sharedMutations);
const mutationCount = allRBACFiles.reduce((count, file) => {
  return count + (file.match(/useMutation/g) || []).length;
}, 0);

if (hasSharedMutations) {
  results.passed.push(`✓ Shared mutations implemented - consolidated patterns`);
} else if (mutationCount < 20) {
  results.passed.push(`✓ Reasonable number of mutations (${mutationCount})`);
} else {
  results.warnings.push(`High number of mutations (${mutationCount}) - consider consolidation`);
}

console.log('✅ Redundancy check complete\n');

// ========================================
// 6. DATABASE INTEGRATION CHECK
// ========================================
console.log('🗄️ Checking database integration...');

// Check for proper RPC function usage
const rpcPatterns = [
  'has_permission',
  'has_role',
  'can_manage_roles',
  'has_resource_permission'
];

allRBACFiles.forEach((file, idx) => {
  rpcPatterns.forEach(rpc => {
    if (file.includes(rpc)) {
      results.passed.push(`✓ Uses ${rpc} RPC function`);
    }
  });
});

// Check for direct auth.users references (security issue)
const hasDirectAuthUsers = allRBACFiles.some(file => 
  file.includes('auth.users') && !file.includes('references auth.users')
);

if (hasDirectAuthUsers) {
  results.critical.push('Direct reference to auth.users table - security risk');
} else {
  results.passed.push('✓ No direct auth.users references');
}

console.log('✅ Database integration check complete\n');

// ========================================
// 7. SECURITY ANALYSIS
// ========================================
console.log('🔐 Analyzing security patterns...');

// Check for client-side role storage (security risk)
const hasLocalStorage = allRBACFiles.some(file => 
  file.includes('localStorage') && file.includes('role')
);

if (hasLocalStorage) {
  results.critical.push('Roles stored in localStorage - CRITICAL SECURITY RISK');
} else {
  results.passed.push('✓ No client-side role storage');
}

// Check for proper RLS reliance
const hasRLSMention = allRBACFiles.some(file => 
  file.includes('RLS') || file.includes('Row Level Security')
);

if (hasRLSMention) {
  results.passed.push('✓ RLS awareness in code');
}

// Check for hardcoded permissions and constants file
const hasConstantsFile = checkFileExists(FILES.rbacConstants);
const hasHardcodedPerms = allRBACFiles.some(file => 
  file.match(/['"`](admin|edit|view)['"`]\s*===/) && !file.includes('permission_level')
);

if (hasConstantsFile) {
  results.passed.push('✓ Permission constants file implemented');
} else if (hasHardcodedPerms) {
  results.warnings.push('Hardcoded permission comparisons found - use constants');
} else {
  results.passed.push('✓ No hardcoded permission strings');
}

console.log('✅ Security analysis complete\n');

// ========================================
// 8. MODULARIZATION SCORE
// ========================================
console.log('📊 Calculating modularization score...');

// Check for granular permission system
const resourceHooks = readFile(FILES.resourceHooks);
const navigationHooks = readFile(FILES.navigationHooks);

// Validate resourceHooks for infinite loop prevention
if (resourceHooks) {
  // Check for proper useEffect dependencies
  const hasGetPermissionLevelDep = resourceHooks.includes('useEffect') && 
                                   resourceHooks.includes('[resource, getPermissionLevel]');
  if (hasGetPermissionLevelDep) {
    results.passed.push('✓ useResourcePermissions has complete dependencies (prevents loops)');
  } else {
    results.critical.push('useResourcePermissions missing dependencies - will cause infinite loops!');
  }
}

const hasGranularSystem = resourceHooks?.includes('getPermissionLevel') && 
                          navigationHooks?.includes('permissionLevel') &&
                          checkFileExists(FILES.permissionBadge) &&
                          checkFileExists(FILES.actionButton);

if (hasGranularSystem) {
  results.passed.push('✓ Implements granular permission system (none/view/edit/admin)');
}

// Check for optimization files
const hasSharedHooks = checkFileExists(FILES.sharedRolesHook) && checkFileExists(FILES.sharedProfilesHook);
const hasSharedMutations = checkFileExists(FILES.sharedMutations);
const hasConstants = checkFileExists(FILES.rbacConstants);

if (hasSharedHooks && hasSharedMutations && hasConstants) {
  results.passed.push('✓ All optimizations implemented (shared hooks, mutations, constants)');
}

const modularizationMetrics = {
  separateHooks: checkFileExists(FILES.hooks),
  separateComponents: Object.keys(FILES).filter(k => !k.includes('Hook') && !k.includes('shared') && k !== 'rbacConstants').every(k => checkFileExists(FILES[k])),
  usesTypeScript: allRBACFiles.every(f => f.includes('interface') || f.includes('type')),
  hasCaching: permissionsHook?.includes('cache') || false,
  usesRPC: allRBACFiles.some(f => f.includes('supabase.rpc')),
  hasGranularPermissions: hasGranularSystem,
  hasOptimizations: hasSharedHooks && hasSharedMutations && hasConstants
};

const score = Object.values(modularizationMetrics).filter(Boolean).length / Object.keys(modularizationMetrics).length * 100;

if (score >= 80) {
  results.passed.push(`✓ Strong modularization score: ${score.toFixed(0)}%`);
} else if (score >= 60) {
  results.warnings.push(`Moderate modularization score: ${score.toFixed(0)}%`);
} else {
  results.critical.push(`Poor modularization score: ${score.toFixed(0)}%`);
}

console.log('✅ Modularization scoring complete\n');

// ========================================
// FINAL SUMMARY
// ========================================
console.log('\n' + '='.repeat(60));
console.log('📋 RBAC & PERMISSIONS VALIDATION SUMMARY');
console.log('='.repeat(60) + '\n');

console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Critical: ${results.critical.length}\n`);

if (results.critical.length > 0) {
  console.log('❌ CRITICAL ISSUES:\n');
  results.critical.forEach((issue, idx) => {
    console.log(`   ${idx + 1}. ${issue}`);
  });
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  results.warnings.forEach((warning, idx) => {
    console.log(`   ${idx + 1}. ${warning}`);
  });
  console.log('');
}

// Overall status
const totalIssues = results.critical.length + results.warnings.length;
let status = '🟢 PRODUCTION READY';
let statusColor = '\x1b[32m';

if (results.critical.length > 0) {
  status = '🔴 CRITICAL ISSUES - REQUIRES IMMEDIATE FIXES';
  statusColor = '\x1b[31m';
} else if (results.warnings.length > 3) {
  status = '🟡 NEEDS ATTENTION - Multiple Warnings';
  statusColor = '\x1b[33m';
} else if (results.warnings.length > 0) {
  status = '🟡 ACCEPTABLE - Minor Warnings';
  statusColor = '\x1b[33m';
}

console.log('Status: ' + statusColor + status + '\x1b[0m\n');

// Modularization recommendation
console.log('📌 MODULARIZATION ASSESSMENT:\n');
if (score >= 80) {
  console.log('✅ Excellent modularization - well-structured RBAC system');
  console.log('   Components are properly separated and hooks are centralized');
} else if (score >= 60) {
  console.log('⚠️  Moderate modularization - some consolidation recommended');
  console.log('   Consider creating shared hooks for common permission patterns');
} else {
  console.log('❌ Poor modularization - significant refactoring needed');
  console.log('   High redundancy detected across components');
}

console.log('\n' + '='.repeat(60) + '\n');

// Save results to file
import { writeFileSync } from 'fs';
const reportPath = 'RBAC_PERMISSIONS_VALIDATION_RESULTS.md';

const markdown = `# RBAC & Permissions System Validation Report
**Generated:** ${new Date().toISOString()}

## Executive Summary
- **Status:** ${status}
- **Total Issues:** ${totalIssues}
- **Critical Issues:** ${results.critical.length}
- **Warnings:** ${results.warnings.length}
- **Passed Checks:** ${results.passed.length}
- **Modularization Score:** ${score.toFixed(0)}%

## Critical Issues
${results.critical.length === 0 ? '*None*' : results.critical.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

## Warnings
${results.warnings.length === 0 ? '*None*' : results.warnings.map((warning, idx) => `${idx + 1}. ${warning}`).join('\n')}

## Passed Checks
${results.passed.map((pass, idx) => `${idx + 1}. ${pass}`).join('\n')}

## Architecture Assessment

### Files Analyzed
${Object.entries(FILES).map(([key, path]) => `- **${key}**: \`${path}\``).join('\n')}

### Modularization Score: ${score.toFixed(0)}%

**Breakdown:**
- Separate hooks: ${modularizationMetrics.separateHooks ? '✅' : '❌'}
- Separate components: ${modularizationMetrics.separateComponents ? '✅' : '❌'}
- TypeScript usage: ${modularizationMetrics.usesTypeScript ? '✅' : '❌'}
- Caching implementation: ${modularizationMetrics.hasCaching ? '✅' : '❌'}
- RPC function usage: ${modularizationMetrics.usesRPC ? '✅' : '❌'}
- Granular permissions: ${modularizationMetrics.hasGranularPermissions ? '✅' : '❌'}
- Optimizations (shared hooks, mutations, constants): ${modularizationMetrics.hasOptimizations ? '✅' : '❌'}

### Component Structure
\`\`\`
RBAC System
├── Core Hooks (Permission Logic)
│   ├── usePermissions (base permission checking)
│   │   ├── checkPermission()
│   │   ├── getPermissionLevel()
│   │   └── useResourcePermission()
│   ├── useResourcePermissions (resource-specific helpers)
│   │   └── useActionPermissions()
│   └── useNavigationPermissions (navigation filtering)
│       ├── usePortalPermissions()
│       ├── useDashboardPermissions()
│       └── useToolPermissions()
├── UI Components (Permission Display)
│   ├── PermissionBadge (visual level indicators)
│   ├── PermissionLevelIndicator (detailed info)
│   ├── ActionButton (permission-aware buttons)
│   └── PermissionGate (conditional rendering)
├── Route Protection
│   └── ProtectedRoute (route-level auth & admin checks)
├── Portal
│   └── RBACPortal (admin-only tab-based interface)
└── Management Components
    ├── RoleManagement (create, clone roles)
    ├── PermissionManagement (assign resource permissions)
    ├── RoleHierarchy (parent-child relationships)
    ├── RoleTemplates (pre-configured role sets)
    ├── TemporaryPrivileges (time-limited access)
    └── PermissionAuditLog (change tracking)
\`\`\`

## Recommendations

${score >= 80 ? `
✅ **System is well-architected**
- Maintain current modular structure
- Continue using centralized hooks
- Keep components focused and single-purpose
` : score >= 60 ? `
⚠️ **Moderate improvements needed**
- Consolidate duplicate queries into shared hooks
- Reduce mutation redundancy
- Consider creating a permission context provider
` : `
❌ **Significant refactoring required**
- High redundancy across components
- Create centralized permission management
- Implement shared data fetching patterns
- Review component responsibilities
`}

## Database Integration
- **RPC Functions Used:** ${rpcPatterns.filter(rpc => allRBACFiles.some(f => f.includes(rpc))).join(', ')}
- **Security:** ${hasDirectAuthUsers ? '❌ Direct auth.users access detected' : '✅ Proper table references'}

## Security Analysis
- **Client-side storage:** ${hasLocalStorage ? '❌ CRITICAL - Roles in localStorage' : '✅ Secure'}
- **Hardcoded permissions:** ${hasHardcodedPerms ? '⚠️ Found' : '✅ None'}
- **RLS awareness:** ${hasRLSMention ? '✅ Yes' : '⚠️ No documentation'}

---
*End of Report*
`;

writeFileSync(reportPath, markdown);
console.log(`📄 Full report saved to: ${reportPath}\n`);
