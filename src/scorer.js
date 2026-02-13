/**
 * Brand Compatibility Scorer
 *
 * Matches brands with creators based on multiple signals:
 * - Niche alignment (30%)
 * - Engagement quality (25%)
 * - Audience size fit (15%)
 * - Brand safety (20%)
 * - Sponsorship history (10%)
 *
 * IMPORTANT: All hardcoded benchmarks are 2024-2025 industry estimates.
 * Verify quarterly and update when new data becomes available.
 */

// Input validation constraints
const VALIDATION_LIMITS = {
    MAX_USERNAME_LENGTH: 100,
    MAX_BIO_LENGTH: 1000,
    MAX_FOLLOWERS: 500_000_000,
    MAX_ENGAGEMENT_RATE: 100,
};

// Brand categories and their compatible niches
// Last verified: February 2025
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
// Uses word boundaries to prevent false positives (e.g., "scandal" != "sandal")
// Last verified: February 2025
const BRAND_SAFETY_FLAGS = {
    high_risk: [
        'controversy', 'scandal', 'lawsuit', 'banned', 'suspended',
        'hate', 'racist', 'violent', 'explicit', 'nsfw', 'extremist'
    ],
    medium_risk: [
        'politics', 'political', 'controversial', 'drama', 'beef',
        'gambling', 'alcohol', 'cbd', 'vape', 'conspiracy'
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
 * Validate creator data for scoring
 *
 * @param {Object} creator - Creator profile data
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateCreatorData(creator) {
    const errors = [];

    if (!creator) {
        errors.push('Creator profile is null or undefined');
        return { isValid: false, errors };
    }

    // Validate followers
    if (typeof creator.followers === 'number') {
        if (creator.followers < 0) {
            errors.push('Followers cannot be negative');
        }
        if (creator.followers > VALIDATION_LIMITS.MAX_FOLLOWERS) {
            errors.push(`Followers exceed reasonable limit (${VALIDATION_LIMITS.MAX_FOLLOWERS})`);
        }
    }

    // Validate engagement rate is 0-100%
    if (typeof creator.engagementRate === 'number') {
        if (creator.engagementRate < 0 || creator.engagementRate > 100) {
            errors.push(`Engagement rate (${creator.engagementRate}%) must be 0-100%`);
        }
    }

    // Validate bio length
    if (creator.bio && creator.bio.length > VALIDATION_LIMITS.MAX_BIO_LENGTH) {
        errors.push(`Bio exceeds max length (${VALIDATION_LIMITS.MAX_BIO_LENGTH} chars)`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Score brand-creator compatibility (0-100)
 * Weighted multi-factor analysis
 *
 * @param {Object} creator - Creator profile data
 * @param {Object} brand - Brand details {category, name, targetTier}
 * @returns {Object} Compatibility score with component breakdown
 */
export function scoreBrandCompatibility(creator, brand) {
    // Validate inputs
    const validation = validateCreatorData(creator);
    if (!validation.isValid) {
        return {
            overallScore: 0,
            rating: { label: 'Invalid Data', emoji: '❌', color: 'red' },
            recommendation: {
                action: 'error',
                message: `Data validation failed: ${validation.errors.join('; ')}`,
                confidence: 'high'
            },
            scores: {},
            strengths: [],
            flags: validation.errors,
            dataQualityScore: 0,
        };
    }

    const scores = {};
    const flags = [];
    const strengths = [];

    // 1. Niche Alignment (30% weight)
    const nicheScore = scoreNicheAlignment(creator, brand);
    scores.niche = nicheScore;

    // 2. Engagement Quality (25% weight)
    const engagementScore = scoreEngagementQuality(creator);
    scores.engagement = engagementScore;

    // 3. Audience Size Fit (15% weight)
    const audienceScore = scoreAudienceFit(creator, brand);
    scores.audience = audienceScore;

    // 4. Brand Safety (20% weight)
    const safetyScore = scoreBrandSafety(creator);
    scores.safety = safetyScore;

    // 5. Sponsorship History (10% weight)
    const historyScore = scoreSponsorshipHistory(creator, brand);
    scores.history = historyScore;

    // Calculate weighted overall score
    // Weights: 30% + 25% + 15% + 20% + 10% = 100%
    const overall = Math.round(
        nicheScore.score * 0.30 +
        engagementScore.score * 0.25 +
        audienceScore.score * 0.15 +
        safetyScore.score * 0.20 +
        historyScore.score * 0.10
    );

    // Collect strengths and concerns
    if (nicheScore.score >= 80) strengths.push(nicheScore.message);
    if (nicheScore.score < 50) flags.push(nicheScore.message);

    if (engagementScore.score >= 80) strengths.push(engagementScore.message);
    if (engagementScore.score < 50) flags.push(engagementScore.message);

    if (safetyScore.flags.length > 0) flags.push(...safetyScore.flags);
    if (safetyScore.score >= 90) strengths.push('Clean brand safety profile');

    if (historyScore.score >= 80) strengths.push(historyScore.message);

    // Calculate data quality
    const dataQualityScore = calculateDataQuality(creator);

    return {
        overallScore: overall,
        rating: getRating(overall),
        recommendation: getRecommendation(overall, flags),
        scores,
        strengths,
        flags,
        dataQualityScore,
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
 * Extract niches from creator profile using word boundary matching
 * Prevents false positives (e.g., "scandal" matching "sandal")
 *
 * @param {Object} creator - Creator profile data
 * @returns {Array} Array of detected niches
 */
function extractNiches(creator) {
    const niches = [];
    const bio = (creator.bio || '').toLowerCase();
    const nickname = (creator.nickname || '').toLowerCase();
    const combinedText = bio + ' ' + nickname;

    // Niche keywords with word boundary detection
    // Last verified: February 2025 - update as TikTok niches evolve
    const nicheKeywords = {
        tech: ['tech', 'technology', 'software', 'app', 'gadget', 'phone', 'computer', 'coder', 'developer'],
        gaming: ['gaming', 'gamer', 'game', 'esports', 'twitch', 'streamer', 'fps', 'rpg'],
        fashion: ['fashion', 'style', 'outfit', 'ootd', 'clothing', 'designer', 'stylist', 'wardroebe'],
        beauty: ['beauty', 'makeup', 'skincare', 'cosmetic', 'glam', 'cosmetics', 'lipstick', 'foundation'],
        fitness: ['fitness', 'gym', 'workout', 'training', 'muscle', 'bodybuilding', 'athlete', 'coach'],
        food: ['food', 'cooking', 'recipe', 'chef', 'foodie', 'restaurant', 'bakery', 'culinary'],
        travel: ['travel', 'wanderlust', 'adventure', 'explore', 'backpack', 'tourism', 'destination'],
        comedy: ['comedy', 'funny', 'humor', 'jokes', 'comedian', 'parody', 'skit'],
        music: ['music', 'singer', 'musician', 'artist', 'producer', 'dj', 'band', 'album'],
        dance: ['dance', 'dancer', 'choreography', 'dancing', 'ballet', 'hip-hop', 'hip hop'],
        education: ['education', 'teacher', 'learn', 'tutorial', 'how to', 'course', 'school', 'academy'],
        business: ['business', 'entrepreneur', 'startup', 'ceo', 'founder', 'corporate', 'enterprise'],
        finance: ['finance', 'money', 'investing', 'stocks', 'crypto', 'wealth', 'trading', 'economics'],
        lifestyle: ['lifestyle', 'life', 'daily', 'vlog', 'day in', 'routine', 'wellness'],
        family: ['family', 'mom', 'dad', 'parent', 'kids', 'baby', 'motherhood', 'fatherhood'],
        pets: ['pets', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'wildlife'],
    };

    // Match keywords with word boundaries to avoid substring matches
    // E.g., "scandal" won't match "sandal"
    for (const [niche, keywords] of Object.entries(nicheKeywords)) {
        for (const keyword of keywords) {
            // Use word boundary regex: \b prevents substring matches
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(combinedText)) {
                niches.push(niche);
                break; // Only add niche once
            }
        }
    }

    // If no explicit niches detected, add verified status
    if (creator.verified && !niches.includes('verified')) {
        niches.push('verified');
    }

    // Ensure unique niches
    return [...new Set(niches)];
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
 * Score brand safety with word boundary checks
 * Prevents false positives using regex word boundaries
 * E.g., "scandal" won't match "sandal"
 *
 * @param {Object} creator - Creator profile data
 * @returns {Object} Brand safety score and flags
 */
function scoreBrandSafety(creator) {
    const bio = (creator.bio || '').toLowerCase();
    const nickname = (creator.nickname || '').toLowerCase();
    const text = bio + ' ' + nickname;

    const flagsFound = [];
    let deduction = 0;

    // Helper function: match keywords with word boundaries
    // Prevents substring matches (e.g., "scandal" ≠ "sandal")
    const matchesFlag = (text, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(text);
    };

    // Check high-risk flags (-30 points each)
    // These indicate serious brand safety concerns
    for (const flag of BRAND_SAFETY_FLAGS.high_risk) {
        if (matchesFlag(text, flag)) {
            flagsFound.push(`🚩 HIGH RISK: "${flag}" detected`);
            deduction += 30;
        }
    }

    // Check medium-risk flags (-15 points each)
    // These may be problematic depending on brand
    for (const flag of BRAND_SAFETY_FLAGS.medium_risk) {
        if (matchesFlag(text, flag)) {
            flagsFound.push(`⚠️ MEDIUM RISK: "${flag}" detected`);
            deduction += 15;
        }
    }

    // Low-risk flags don't penalize (just informational)
    // They indicate prior sponsorships (positive signal)

    const score = Math.max(0, 100 - deduction);

    return {
        score,
        flags: flagsFound,
        riskLevel: deduction > 30 ? 'high' : deduction > 0 ? 'medium' : 'low',
        message: flagsFound.length === 0
            ? 'No brand safety concerns detected'
            : `⚠️ ${flagsFound.length} potential brand safety issue(s) detected`,
    };
}

/**
 * Score sponsorship readiness and history
 * Considers monetization indicators and professional setup
 *
 * @param {Object} creator - Creator profile data
 * @param {Object} brand - Brand details (for future brand-specific scoring)
 * @returns {Object} Sponsorship readiness score and message
 */
function scoreSponsorshipHistory(creator, brand) {
    // Indicators of sponsorship experience and readiness
    const hasBioLink = !!(creator.bioLink && creator.bioLink.trim().length > 0);
    const isVerified = creator.verified === true;
    const isCommerce = creator.commerceUser === true || creator.ttSeller === true;
    const hasMultipleLinks = creator.bioLinks && Array.isArray(creator.bioLinks) && creator.bioLinks.length > 1;

    let score = 50;  // Base score: neutral
    let message = 'Unknown sponsorship history';

    // Highest readiness: commerce account
    // Indicates existing monetization and brand deal infrastructure
    if (isCommerce) {
        score = 95;
        message = 'Commerce account - proven experience with brand partnerships and monetization';
    }
    // Strong readiness: verified + multiple links
    // Indicates professional monetization setup
    else if (isVerified && hasMultipleLinks) {
        score = 90;
        message = 'Verified with multiple monetization links - highly brand-ready';
    }
    // Good readiness: verified + bio link
    // Indicates professional intent
    else if (isVerified && hasBioLink) {
        score = 80;
        message = 'Verified with professional bio link - likely experienced with sponsorships';
    }
    // Moderate readiness: just bio link or verified
    // One indicator of professionalism
    else if (hasBioLink && !isVerified) {
        score = 65;
        message = 'Professional bio setup - some sponsorship readiness';
    } else if (isVerified && !hasBioLink) {
        score = 60;
        message = 'Platform verified - but minimal external monetization setup';
    }
    // Low readiness: no professional indicators
    else {
        score = 40;
        message = 'Limited professional setup indicators. May need guidance on brand deal process.';
    }

    return { score, message };
}

/**
 * Calculate data quality score based on available fields
 *
 * @param {Object} creator - Creator profile data
 * @returns {number} Data quality score (0-100)
 */
function calculateDataQuality(creator) {
    const requiredFields = [
        'username',
        'followers',
        'engagementRate',
        'bio',
        'verified',
        'nickname',
    ];

    const presentFields = requiredFields.filter(
        field => creator[field] !== null && creator[field] !== undefined && creator[field] !== ''
    );

    return Math.round((presentFields.length / requiredFields.length) * 100);
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
