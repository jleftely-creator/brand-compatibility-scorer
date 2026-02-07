# Brand Compatibility Scorer

Match brands with compatible creators based on niche alignment, engagement quality, brand safety, and sponsorship readiness.

## What It Does

This actor evaluates creator-brand fit across 5 dimensions:

| Signal | Weight | What It Measures |
|--------|--------|------------------|
| Niche Alignment | 30% | Does creator's content match brand's category? |
| Engagement Quality | 25% | Is engagement rate healthy for their tier? |
| Audience Size Fit | 15% | Does creator match brand's target tier? |
| Brand Safety | 20% | Any controversial content or red flags? |
| Sponsorship History | 10% | Is creator professionally set up for deals? |

## Output

```json
{
  "username": "creator_name",
  "compatibility": {
    "overallScore": 82,
    "rating": { "label": "Good Match", "emoji": "✅" },
    "recommendation": {
      "action": "recommend",
      "message": "Good fit. Worth exploring a partnership opportunity."
    },
    "strengths": ["Strong niche alignment: tech, gaming"],
    "flags": []
  }
}
```

## Compatibility Ratings

| Score | Rating | Recommendation |
|-------|--------|----------------|
| 85+ | 🎯 Excellent Match | Strongly recommend partnership |
| 70-84 | ✅ Good Match | Worth exploring |
| 55-69 | 🟡 Moderate Match | Depends on campaign needs |
| 40-54 | 🟠 Weak Match | Consider other creators |
| <40 | 🔴 Poor Match | Not recommended |

## Input

```json
{
  "brand": {
    "name": "Acme Tech",
    "category": "technology",
    "targetTier": "micro"
  },
  "tiktokUsernames": ["techcreator1", "techcreator2", "techcreator3"],
  "rankMode": true
}
```

### Brand Categories

- technology, software, gaming
- fashion, beauty, fitness
- finance, crypto, business
- entertainment, music, film
- travel, home, automotive
- education, health

### Target Tiers

- nano (1K-10K followers)
- micro (10K-50K)
- mid-tier (50K-500K)
- macro (500K-1M)
- mega (1M+)

## Rank Mode

When `rankMode: true`, returns creators sorted by compatibility with a top pick:

```json
{
  "rankedCreators": [...],
  "topPick": { "username": "best_creator", "overallScore": 92 },
  "summary": { "excellent": 2, "good": 3, "moderate": 1, "weak": 0 }
}
```

## Brand Safety Detection

Scans creator profiles for:
- **High Risk**: controversy, scandal, hate speech, explicit content
- **Medium Risk**: political content, gambling, alcohol references

Creators with high-risk flags are automatically marked "avoid."

## Use Cases

- **Brands**: Find compatible creators for campaigns
- **Agencies**: Screen creator rosters for client matches
- **Platforms**: Power creator-brand matching features

## Pricing

~$0.03 per creator scored (includes TikTok profile fetch).

---

Built by [Creator Fusion](https://creatorfusion.net)
