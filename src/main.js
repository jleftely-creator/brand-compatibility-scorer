/**
 * Brand Compatibility Scorer
 * 
 * Matches brands with compatible creators based on:
 * - Niche alignment
 * - Engagement quality  
 * - Audience size fit
 * - Brand safety
 * - Sponsorship readiness
 */

import { Actor } from 'apify';
import { ApifyClient } from 'apify-client';
import { scoreBrandCompatibility, rankCreatorsForBrand } from './scorer.js';

await Actor.init();

const input = await Actor.getInput() ?? {};

const {
    // Brand details
    brand = {},
    
    // Creator inputs
    tiktokUsernames = [],
    profiles = [],       // Pre-fetched profiles
    
    // Options
    fetchProfiles = true, // Fetch profiles from TikTok scraper
    rankMode = false,     // Rank multiple creators for one brand
    
    apiToken = null,
} = input;

// Validate brand input
if (!brand.category && !brand.name) {
    throw new Error('Brand must have at least a category or name. Example: { category: "technology", name: "Acme Corp" }');
}

// Build creator list
let creators = [...profiles];

// Fetch TikTok profiles if needed
if (fetchProfiles && tiktokUsernames.length > 0) {
    console.log(`Fetching ${tiktokUsernames.length} TikTok profiles...`);
    
    const client = new ApifyClient({
        token: apiToken || process.env.APIFY_TOKEN,
    });
    
    const TIKTOK_SCRAPER = 'apricot_blackberry/tiktok-profile-scraper';
    
    try {
        const run = await client.actor(TIKTOK_SCRAPER).call({
            usernames: tiktokUsernames,
            delayBetweenRequests: 1000,
        }, {
            memory: 1024,
            timeout: 120,
        });
        
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        creators.push(...items);
        console.log(`Fetched ${items.length} profiles successfully`);
    } catch (error) {
        console.error('Error fetching profiles:', error.message);
    }
}

if (creators.length === 0) {
    throw new Error('No creators to analyze. Provide tiktokUsernames or pre-fetched profiles.');
}

console.log(`\nScoring ${creators.length} creators for brand: ${brand.name || brand.category}`);
console.log('Brand category:', brand.category || 'not specified');
console.log('Target tier:', brand.targetTier || 'any');

// Score creators
if (rankMode && creators.length > 1) {
    // Rank multiple creators
    const ranking = rankCreatorsForBrand(creators, brand);
    
    console.log('\n' + '='.repeat(50));
    console.log('CREATOR RANKING');
    console.log('='.repeat(50));
    
    ranking.rankedCreators.forEach((result, i) => {
        const emoji = result.rating.emoji;
        console.log(`${i + 1}. ${emoji} @${result.username}: ${result.overallScore}/100 (${result.rating.label})`);
    });
    
    console.log(`\nSummary: ${ranking.summary.excellent} excellent, ${ranking.summary.good} good, ${ranking.summary.moderate} moderate, ${ranking.summary.weak} weak`);
    
    if (ranking.topPick) {
        console.log(`\n🏆 Top Pick: @${ranking.topPick.username}`);
    }
    
    await Actor.pushData({
        type: 'ranking',
        brand: { name: brand.name, category: brand.category },
        ...ranking,
        analyzedAt: new Date().toISOString(),
    });
    
} else {
    // Individual scoring
    for (const creator of creators) {
        const result = scoreBrandCompatibility(creator, brand);
        
        const output = {
            username: creator.username,
            profileUrl: `https://www.tiktok.com/@${creator.username}`,
            brand: { name: brand.name, category: brand.category },
            
            profile: {
                nickname: creator.nickname,
                followers: creator.followers,
                engagementRate: creator.engagementRate,
                verified: creator.verified,
                bioLink: creator.bioLink,
            },
            
            compatibility: result,
            analyzedAt: new Date().toISOString(),
        };
        
        await Actor.pushData(output);
        
        const emoji = result.rating.emoji;
        console.log(`\n${emoji} @${creator.username}: ${result.overallScore}/100 (${result.rating.label})`);
        console.log(`   Recommendation: ${result.recommendation.action.toUpperCase()}`);
        
        if (result.strengths.length > 0) {
            console.log(`   ✅ Strengths: ${result.strengths.slice(0, 2).join('; ')}`);
        }
        if (result.flags.length > 0) {
            console.log(`   ⚠️ Concerns: ${result.flags.slice(0, 2).join('; ')}`);
        }
    }
}

console.log('\n' + '='.repeat(50));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(50));

await Actor.exit();
