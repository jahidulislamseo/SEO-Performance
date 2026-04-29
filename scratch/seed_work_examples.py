import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'api'))

import shared_utils
import time

def seed_work_examples():
    db = shared_utils.get_db()
    
    categories = [
      {
        "id": "onpage",
        "title": "Onpage / AEO / GEO",
        "emoji": "🎯",
        "description": "Optimization for Search, Answer Engines, and Generative Experience.",
        "examples": [
          { "name": "AI Search Optimization", "client": "TechFlow Solutions", "result": "+240% Visibility in SGE", "detail": "Content restructuring for LLM-based search engines." },
          { "name": "Schema Architecture", "client": "ShopMax Retail", "result": "Rich Snippets for 90% URLs", "detail": "Advanced JSON-LD implementation for product sets." },
          { "name": "GEO-targeted Landing Pages", "client": "Global Relo", "result": "15k Monthly Organic Leads", "detail": "Geo-specific optimization for multi-regional services." },
          { "name": "Core Web Vitals Audit", "client": "Pulse Media", "result": "99/100 Mobile Score", "detail": "Speed and performance optimization for publisher nodes." },
          { "name": "Semantic Keyword Mapping", "client": "EduPath", "result": "Ranked #1 for 50+ High Vol Terms", "detail": "Topic cluster strategy and entity-based optimization." }
        ]
      },
      {
        "id": "local-seo",
        "title": "Local SEO",
        "emoji": "📍",
        "description": "Hyper-local optimization and Google Business Profile management.",
        "examples": [
          { "name": "GBP Dominance", "client": "The Dental Hub", "result": "Ranked Top 3 for \"Dentist near me\"", "detail": "Daily GMB updates and local citation synchronization." },
          { "name": "Hyper-local Citations", "client": "City Movers", "result": "85% Increase in Phone Calls", "detail": "Building niche-specific local business directories." },
          { "name": "Review Management System", "client": "Elite Restaurant", "result": "4.9 Star Average (500+ Reviews)", "detail": "Automated review request and monitoring workflow." },
          { "name": "Local Backlink Campaign", "client": "AutoCare NY", "result": "DA increase from 12 to 34", "detail": "Sourcing links from local news and community sites." },
          { "name": "Multi-location Sync", "client": "FitNation Gyms", "result": "Unified NAP across 12 branches", "detail": "Centralized management of physical location data." }
        ]
      },
      {
        "id": "backlink",
        "title": "Backlink Strategy",
        "emoji": "🔗",
        "description": "High-authority link building and relationship management.",
        "examples": [
          { "name": "Skyscraper Outreach", "client": "SaaS Pro", "result": "45 DR70+ Backlinks", "detail": "Content-driven outreach for high-intent SaaS keywords." },
          { "name": "Broken Link Building", "client": "HealthGuide", "result": "12 Edu/Gov Backlinks", "detail": "Finding and replacing dead resource links in health niche." },
          { "name": "Resource Page Links", "client": "Finance Expert", "result": "Ranked #1 for \"Mortgage Tips\"", "detail": "Placement on authoritative financial resource pages." },
          { "name": "Niche Edits Campaign", "client": "PetLovers", "result": "Steady Traffic Growth (15%/mo)", "detail": "Securing contextual links in existing relevant articles." },
          { "name": "Competitor Gap Link Building", "client": "eCom Store", "result": "Outranked Competitor B", "detail": "Analyzing and acquiring links that competitors possess." }
        ]
      },
      {
        "id": "guest-post",
        "title": "Guest Posting",
        "emoji": "✍️",
        "description": "Quality content placement on top-tier publications.",
        "examples": [
          { "name": "Forbes/Entrepreneur Placement", "client": "Tech CEO", "result": "Instant Brand Authority", "detail": "High-end PR and guest posting on top-tier sites." },
          { "name": "Tech Niche Publication", "client": "DevCloud", "result": "DA80+ Contextual Link", "detail": "Securing placements on major tech industry blogs." },
          { "name": "Blogger Outreach", "client": "Lifestyle Brand", "result": "20+ Monthly Placements", "detail": "Scaling guest posting across niche-relevant blogs." },
          { "name": "Content Syndication", "client": "Market News", "result": "5k Referral Visits", "detail": "Publishing and syndicating expert content across networks." },
          { "name": "Industry Whitepapers", "client": "Legal Firm", "result": "Highly Cited Resource", "detail": "Placement of expert research in legal publications." }
        ]
      },
      {
        "id": "smm",
        "title": "Social Media Management",
        "emoji": "📱",
        "description": "Engagement, growth, and performance-based social marketing.",
        "examples": [
          { "name": "Viral Reel Campaign", "client": "Fashion Hub", "result": "1.2M Organic Impressions", "detail": "Strategic short-form video content for Instagram/TikTok." },
          { "name": "Community Engagement", "client": "Crypto Wave", "result": "50k Discord Members", "detail": "Active moderation and community building for Web3." },
          { "name": "Influencer Collabs", "client": "Beauty Box", "result": "300% ROI on Campaign", "detail": "Managing partnerships with niche micro-influencers." },
          { "name": "Ads Management (FB/IG)", "client": "Real Estate Pro", "result": "$2.50 CPL (Lead Gen)", "detail": "Advanced targeting and creative A/B testing." },
          { "name": "LinkedIn Thought Leadership", "client": "B2B Consulting", "result": "Top 1% Industry SSI", "detail": "Ghostwriting and profile optimization for executives." }
        ]
      }
    ]

    db["work_examples"].update_one(
        {"_id": "portfolio"},
        {"$set": {"categories": categories, "updated_at": time.time()}},
        upsert=True
    )
    print("✅ Seeded work examples into MongoDB.")

if __name__ == "__main__":
    seed_work_examples()
