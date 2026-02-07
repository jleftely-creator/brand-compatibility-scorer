/**
 * Brand Compatibility Scorer
 * 
 * Matches brands with creators based on multiple signals.
 */

// Brand categories and their compatible niches
const BRAND_NICHE_MAP = {
    // Tech & Software
    'technology': ['tech', 'gaming', 'education', 'business', 'science'],
    'software': ['tech', 'business', 'education', 'productivity'],
    'gaming': ['gaming', 'tech', 'entertainment', 'esports'],
    
    // Consumer Products
    'fashion': ['fashion', 'beauty', 'lifestyle', 'luxury'],
    'beauty': ['beauty', 'fashion', 'lifestyle', 'skincare', 'wellness'],
    'fitness': ['fitness', 'health', 'sports', 'wellness', 'nutrition'],
    'food': ['food', 'cooking', 'lifestyle', 'health', 'family'],
    
    // Finance & Business
    'finance': ['finance', 'business', 'investing', 'crypto', 'education'],
    'crypto': ['crypto', 'finance', 'tech', 'investing'],
    'business': ['business', 'finance', 'entrepreneurship', 'education'],
    
    // Entertainment
    'entertainment': ['entertainment', 'comedy', 'music', 'film', 'pop culture'],
    'music': ['music', 'entertainment', 'lifestyle'],
    'film': ['film', 'entertainment', 'pop culture', 'reviews'],
    
    // Lifestyle
    'travel': ['travel', 'lifestyle', 'adventure', 'photography'],
    'home': ['home', 'diy', 'lifestyle', 'family', 'interior design'],
    'automotive': ['automotive', 'cars', 'tech', 'lifestyle', 'luxury'],
    
    // Services
    'education': ['education', 'learning', 'career', 'business', 'tech'],
    'health': ['health', 'wellness', 'fitness', 'mental health', 'nutrition'],
    'dating': ['lifestyle', 'relationships', 'entertainment', 'comedy'],
};

// Brand safety keywords to flag
const BRAND_SAFETY_FLAGS = {
    high_risk: [
        'controversy', 'scandal', 'lawsuit', 'banned', 'suspended',
        'hate', 'racist', 'violent', 'explicit', 'nsfw'
    ],
    medium_risk: [
        'politics', 'political', 'controversial', 'drama', 'beef',
        'gambling', 'alcohol', 'cbd', 'vape'
    ],
    low_risk: [
        'sponsored', 'ad', 'paid', 'promo' // Just indicates prior sponsorships
    ]
};

// Engagement quality thresholds by tier
const ENGAGEMENT_THRESHOLDS = {
    nano: { excellent: 10, good: 7, acceptable: 4 },
    micro: { excellent: 8, good: 5, acceptable: 3 },
    'mid-tier': { excellent: 6, good: 4, acceptable: 2.5 },
    macro: { excellent: 4, good: 2.5, acceptable: 1.5 },
    mega: { excellent: 3, good: 2, acceptable: 1 },
};

/**
 * Score brand-creator compatibility
 */
export function scoreBrandCompatibility(creator, brand) {
    const scores = {};
    const flags = [];
    const strengths = [];
    
    // 1. Niche Alignment (30%)
    const nicheScore = scoreNicheAlignment(creator, brand);
    scores.niche = nicheScore;
    
    // 2. Engagement Quality (25%)
    const engagementScore = scoreEngagementQuality(creator);
    scores.engagement = engagementScore;
    
    // 3. Audience Size Fit (15%)
    const audienceScore = scoreAudienceFit(creator, brand);
    scores.audience = audienceScore;
    
    // 4. Brand Safety (20%)
    const safetyScore = scoreBrandSafety(creator);
    scores.safety = safetyScore;
    
    // 5. Sponsorship History (10%)
    const historyScore = scoreSponsorshipHistory(creator, brand);
    scores.history = historyScore;
    
    // Calculate weighted overall score
    const overall = Math.round(
        nicheScore.score * 0.30 +
        engagementScore.score * 0.25 +
        audienceScore.score * 0.15 +
        safetyScore.score * 0.20 +
        historyScore.score * 0.10
    );
    
    // Collect flags and strengths
    if (nicheScore.score >= 80) strengths.push(nicheScore.message);
    if (nicheScore.score < 50) flags.push(nicheScore.message);
    
    if (engagementScore.score >= 80) strengths.push(engagementScore.message);
    if (engagementScore.score < 50) flags.push(engagementScore.message);
    
    if (safetyScore.flags.length > 0) flags.push(...safetyScore.flags);
    if (safetyScore.score >= 90) strengths.push('Clean brand safety profile');
    
    if (historyScore.score >= 80) strengths.push(historyScore.message);
    
    return {
        overallScore: overall,
        rating: getRating(overall),
        recommendation: getRecommendation(overall, flags),
        scores,
        strengths,
        flags,
    };
}

/**
 * Score niche alignment between creator and brand
 */
function scoreNicheAlignment(creator, brand) {
    const brandCategory = brand.category?.toLowerCase() || 'general';
    const compatibleNiches = BRAND_NICHE_MAP[brandCategory] || [];
    
    // Extract creator niches from bio and content
    const creatorNiches = extractNiches(creator);
    
    // Check for overlap
    const matchingNiches = creatorNiches.filter(n => 
        compatibleNiches.some(cn => n.includes(cn) || cn.includes(n))
    );
    
    if (matchingNiches.length >= 2) {
        return {
            score: 95,
            message: `Strong niche alignment: ${matchingNiches.join(', ')}`,
            matches: matchingNiches
        };
    }
    if (matchingNiches.length === 1) {
        return {
            score: 75,
            message: `Good niche alignment: ${matchingNiches[0]}`,
            matches: matchingNiches
        };
    }
    if (creatorNiches.length === 0) {
        return {
            score: 50,
            message: 'Unable to determine creator niche',
            matches: []
        };
    }
    return {
        score: 30,
        message: `Low niche alignment - creator focuses on: ${creatorNiches.slice(0, 3).join(', ')}`,
        matches: []
    };
}

/**
 * Extract niches from creator profile
 */
function extractNiches(creator) {
    const niches = [];
    const bio = (creator.bio || '').toLowerCase();
    const nickname = (creator.nickname || '').toLowerCase();
    
    const nicheKeywords = {
        'tech': ['tech', 'technology', 'software', 'app', 'gadget', 'phone', 'computer'],
        'gaming': ['gaming', 'gamer', 'game', 'esports', 'twitch', 'streamer'],
        'fashion': ['fashion', 'style', 'outfit', 'ootd', 'clothing', 'designer'],
        'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic', 'glam'],
        'fitness': ['fitness', 'gym', 'workout', 'training', 'muscle', 'bodybuilding'],
        'food': ['food', 'cooking', 'recipe', 'chef', 'foodie', 'restaurant'],
        'travel': ['travel', 'wanderlust', 'adventure', 'explore', 'backpack'],
        'comedy': ['comedy', 'funny', 'humor', 'jokes', 'comedian'],
        'music': ['music', 'singer', 'musician', 'artist', 'producer', 'dj'],
        'dance': ['dance', 'dancer', 'choreography', 'dancing'],
        'education': ['education', 'teacher', 'learn', 'tutorial', 'how to'],
        'business': ['business', 'entrepreneur', 'startup', 'ceo', 'founder'],
        'finance': ['finance', 'money', 'investing', 'stocks', 'crypto', 'wealth'],
        'lifestyle': ['lifestyle', 'life', 'daily', 'vlog', 'day in'],
        'family': ['family', 'mom', 'dad', 'parent', 'kids', 'baby'],
        'pets': ['pets', 'dog', 'cat', 'puppy', 'kitten', 'animal'],
    };
    
    for (const [niche, keywords] of Object.entries(nicheKeywords)) {
        if (keywords.some(k => bio.includes(k) || nickname.includes(k))) {
            niches.push(niche);
        }
    }
    
    // If no explicit niches, check verified/commerce status
    if (creator.verified) {
        niches.push('verified creator');
    }
    
    return niches;
}

/**
 * Score engagement quality
 */
function scoreEngagementQuality(creator) {
    const followers = creator.followers || 0;
    const engagementRate = creator.engagementRate || 0;
    
    // Determine tier
    let tier = 'nano';
    if (followers >= 1000000) tier = 'mega';
    else if (followers >= 500000) tier = 'macro';
    else if (followers >= 100000) tier = 'mid-tier';
    else if (followers >= 10000) tier = 'micro';
    
    const thresholds = ENGAGEMENT_THRESHOLDS[tier];
    
    if (engagementRate >= thresholds.excellent) {
        return {
            score: 95,
            tier,
            message: `Excellent engagement (${engagementRate.toFixed(1)}%) for ${tier} tier`
        };
    }
    if (engagementRate >= thresholds.good) {
        return {
            score: 75,
            tier,
            message: `Good engagement (${engagementRate.toFixed(1)}%) for ${tier} tier`
        };
    }
    if (engagementRate >= thresholds.acceptable) {
        return {
            score: 55,
            tier,
            message: `Acceptable engagement (${engagementRate.toFixed(1)}%) for ${tier} tier`
        };
    }
    return {
        score: 30,
        tier,
        message: `Below average engagement (${engagementRate.toFixed(1)}%) for ${tier} tier`
    };
}

/**
 * Score audience size fit for brand
 */
function scoreAudienceFit(creator, brand) {
    const followers = creator.followers || 0;
    const targetTier = brand.targetTier?.toLowerCase() || 'any';
    
    let tier = 'nano';
    if (followers >= 1000000) tier = 'mega';
    else if (followers >= 500000) tier = 'macro';
    else if (followers >= 100000) tier = 'mid-tier';
    else if (followers >= 10000) tier = 'micro';
    
    if (targetTier === 'any') {
        return { score: 70, tier, message: 'No specific tier requirement' };
    }
    
    if (tier === targetTier) {
        return { score: 95, tier, message: `Perfect tier match: ${tier}` };
    }
    
    // Adjacent tiers get partial credit
    const tierOrder = ['nano', 'micro', 'mid-tier', 'macro', 'mega'];
    const creatorIndex = tierOrder.indexOf(tier);
    const targetIndex = tierOrder.indexOf(targetTier);
    const distance = Math.abs(creatorIndex - targetIndex);
    
    if (distance === 1) {
        return { score: 70, tier, message: `Close tier match: ${tier} vs target ${targetTier}` };
    }
    
    return { score: 40, tier, message: `Tier mismatch: ${tier} vs target ${targetTier}` };
}

/**
 * Score brand safety
 */
function scoreBrandSafety(creator) {
    const bio = (creator.bio || '').toLowerCase();
    const nickname = (creator.nickname || '').toLowerCase();
    const text = bio + ' ' + nickname;
    
    const flagsFound = [];
    let deduction = 0;
    
    // Check high risk flags
    for (const flag of BRAND_SAFETY_FLAGS.high_risk) {
        if (text.includes(flag)) {
            flagsFound.push(`High risk: "${flag}" found in profile`);
            deduction += 30;
        }
    }
    
    // Check medium risk flags
    for (const flag of BRAND_SAFETY_FLAGS.medium_risk) {
        if (text.includes(flag)) {
            flagsFound.push(`Medium risk: "${flag}" found in profile`);
            deduction += 15;
        }
    }
    
    const score = Math.max(0, 100 - deduction);
    
    return {
        score,
        flags: flagsFound,
        message: flagsFound.length === 0 
            ? 'No brand safety concerns detected'
            : `${flagsFound.length} potential brand safety issue(s)`
    };
}

/**
 * Score sponsorship history
 */
function scoreSponsorshipHistory(creator, brand) {
    // Check if creator has bio link (indicates professional setup)
    const hasBioLink = !!creator.bioLink;
    const isVerified = creator.verified;
    const isCommerce = creator.commerceUser || creator.ttSeller;
    
    let score = 50; // Base score
    let message = 'Unknown sponsorship history';
    
    if (isCommerce) {
        score = 90;
        message = 'Commerce-enabled account - experienced with brand deals';
    } else if (isVerified && hasBioLink) {
        score = 85;
        message = 'Verified with professional setup - likely brand-ready';
    } else if (hasBioLink) {
        score = 70;
        message = 'Has bio link - some professional presence';
    } else if (isVerified) {
        score = 65;
        message = 'Verified but no external links';
    }
    
    return { score, message };
}

/**
 * Get rating label from score
 */
function getRating(score) {
    if (score >= 85) return { label: 'Excellent Match', emoji: '🎯', color: 'green' };
    if (score >= 70) return { label: 'Good Match', emoji: '✅', color: 'light-green' };
    if (score >= 55) return { label: 'Moderate Match', emoji: '🟡', color: 'yellow' };
    if (score >= 40) return { label: 'Weak Match', emoji: '🟠', color: 'orange' };
    return { label: 'Poor Match', emoji: '🔴', color: 'red' };
}

/**
 * Get recommendation based on score and flags
 */
function getRecommendation(score, flags) {
    const hasHighRiskFlags = flags.some(f => f.includes('High risk'));
    
    if (hasHighRiskFlags) {
        return {
            action: 'avoid',
            message: 'Brand safety concerns detected. Not recommended for partnership.',
            confidence: 'high'
        };
    }
    
    if (score >= 80) {
        return {
            action: 'strong_recommend',
            message: 'Excellent fit. Strongly recommend reaching out for partnership.',
            confidence: 'high'
        };
    }
    
    if (score >= 65) {
        return {
            action: 'recommend',
            message: 'Good fit. Worth exploring a partnership opportunity.',
            confidence: 'medium'
        };
    }
    
    if (score >= 50) {
        return {
            action: 'consider',
            message: 'Moderate fit. May work depending on specific campaign needs.',
            confidence: 'low'
        };
    }
    
    return {
        action: 'not_recommended',
        message: 'Low compatibility. Consider other creators.',
        confidence: 'medium'
    };
}

/**
 * Score multiple creators for a brand
 */
export function rankCreatorsForBrand(creators, brand) {
    const results = creators.map(creator => ({
        username: creator.username,
        ...scoreBrandCompatibility(creator, brand)
    }));
    
    // Sort by overall score descending
    results.sort((a, b) => b.overallScore - a.overallScore);
    
    return {
        brand: brand.name || brand.category,
        rankedCreators: results,
        topPick: results[0] || null,
        summary: {
            excellent: results.filter(r => r.overallScore >= 85).length,
            good: results.filter(r => r.overallScore >= 70 && r.overallScore < 85).length,
            moderate: results.filter(r => r.overallScore >= 55 && r.overallScore < 70).length,
            weak: results.filter(r => r.overallScore < 55).length,
        }
    };
}
