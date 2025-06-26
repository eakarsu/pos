import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface SEOAuditResult {
  score: number;
  issues: string[];
  recommendations: string[];
  passed: string[];
}

async function runSEOAudit(): Promise<SEOAuditResult> {
  const result: SEOAuditResult = {
    score: 0,
    issues: [],
    recommendations: [],
    passed: []
  };

  let totalChecks = 0;
  let passedChecks = 0;

  console.log('🔍 Running SEO Audit for ElitePos...\n');

  // Check 1: Sitemap exists
  totalChecks++;
  const sitemapPath = resolve(process.cwd(), 'public', 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    passedChecks++;
    result.passed.push('✅ Sitemap.xml exists');
  } else {
    result.issues.push('❌ Missing sitemap.xml');
    result.recommendations.push('Run: npm run generate:sitemap');
  }

  // Check 2: Robots.txt exists
  totalChecks++;
  const robotsPath = resolve(process.cwd(), 'public', 'robots.txt');
  if (existsSync(robotsPath)) {
    passedChecks++;
    result.passed.push('✅ Robots.txt exists');
  } else {
    result.issues.push('❌ Missing robots.txt');
    result.recommendations.push('Generate robots.txt with sitemap reference');
  }

  // Check 3: PWA Manifest exists
  totalChecks++;
  const manifestPath = resolve(process.cwd(), 'public', 'site.webmanifest');
  if (existsSync(manifestPath)) {
    passedChecks++;
    result.passed.push('✅ PWA manifest exists');
    
    // Validate manifest content
    try {
      const manifestContent = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      if (manifestContent.name && manifestContent.short_name && manifestContent.icons) {
        result.passed.push('✅ PWA manifest is properly configured');
      } else {
        result.issues.push('⚠️ PWA manifest missing required fields');
      }
    } catch (error) {
      result.issues.push('❌ PWA manifest has invalid JSON');
    }
  } else {
    result.issues.push('❌ Missing PWA manifest');
    result.recommendations.push('Create site.webmanifest for PWA support');
  }

  // Check 4: Favicon files
  totalChecks++;
  const faviconPath = resolve(process.cwd(), 'public', 'favicon.ico');
  if (existsSync(faviconPath)) {
    passedChecks++;
    result.passed.push('✅ Favicon exists');
  } else {
    result.issues.push('❌ Missing favicon.ico');
    result.recommendations.push('Add favicon.ico and related icon files');
  }

  // Check 5: SEO Components exist
  totalChecks++;
  const seoHeadPath = resolve(process.cwd(), 'frontend', 'src', 'components', 'SEO', 'SEOHead.tsx');
  if (existsSync(seoHeadPath)) {
    passedChecks++;
    result.passed.push('✅ SEO Head component exists');
  } else {
    result.issues.push('❌ Missing SEO Head component');
    result.recommendations.push('Create SEOHead component for meta tags');
  }

  // Check 6: Structured Data component
  totalChecks++;
  const structuredDataPath = resolve(process.cwd(), 'frontend', 'src', 'components', 'SEO', 'StructuredData.tsx');
  if (existsSync(structuredDataPath)) {
    passedChecks++;
    result.passed.push('✅ Structured Data component exists');
  } else {
    result.issues.push('❌ Missing Structured Data component');
    result.recommendations.push('Create StructuredData component for rich snippets');
  }

  // Check 7: Package.json SEO dependencies
  totalChecks++;
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const seoDeps = ['react-helmet-async', 'sitemap', 'next-sitemap'];
    const missingDeps = seoDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length === 0) {
      passedChecks++;
      result.passed.push('✅ SEO dependencies installed');
    } else {
      result.issues.push(`❌ Missing SEO dependencies: ${missingDeps.join(', ')}`);
      result.recommendations.push(`Install: npm install ${missingDeps.join(' ')}`);
    }
  }

  // Check 8: CSS optimizations
  totalChecks++;
  const cssPath = resolve(process.cwd(), 'frontend', 'src', 'index.css');
  if (existsSync(cssPath)) {
    const cssContent = readFileSync(cssPath, 'utf-8');
    if (cssContent.includes('content-visibility') && cssContent.includes('font-display')) {
      passedChecks++;
      result.passed.push('✅ CSS performance optimizations present');
    } else {
      result.issues.push('⚠️ CSS missing performance optimizations');
      result.recommendations.push('Add content-visibility and font-display optimizations');
    }
  }

  // Calculate score
  result.score = Math.round((passedChecks / totalChecks) * 100);

  return result;
}

async function displayAuditResults() {
  const result = await runSEOAudit();
  
  console.log('📊 SEO AUDIT RESULTS');
  console.log('===================');
  console.log(`Overall Score: ${result.score}/100\n`);
  
  if (result.passed.length > 0) {
    console.log('✅ PASSED CHECKS:');
    result.passed.forEach(item => console.log(`   ${item}`));
    console.log('');
  }
  
  if (result.issues.length > 0) {
    console.log('❌ ISSUES FOUND:');
    result.issues.forEach(item => console.log(`   ${item}`));
    console.log('');
  }
  
  if (result.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    result.recommendations.forEach(item => console.log(`   ${item}`));
    console.log('');
  }
  
  // Score interpretation
  if (result.score >= 90) {
    console.log('🎉 Excellent! Your SEO setup is in great shape.');
  } else if (result.score >= 70) {
    console.log('👍 Good SEO setup, but there are some improvements to make.');
  } else if (result.score >= 50) {
    console.log('⚠️ Your SEO needs attention. Please address the issues above.');
  } else {
    console.log('🚨 Critical SEO issues found. Immediate action required.');
  }
  
  console.log('\n📚 Additional SEO Best Practices:');
  console.log('   • Optimize images with proper alt tags');
  console.log('   • Use semantic HTML structure');
  console.log('   • Implement proper heading hierarchy (H1-H6)');
  console.log('   • Add internal linking between related pages');
  console.log('   • Monitor Core Web Vitals regularly');
  console.log('   • Create quality, keyword-rich content');
  console.log('   • Set up Google Search Console');
  console.log('   • Monitor page load speeds');
}

// Run the audit
if (require.main === module) {
  displayAuditResults().catch(console.error);
}

export { runSEOAudit };
