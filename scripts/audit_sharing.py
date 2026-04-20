import json, os, urllib.request, re, time
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        if not match: return []
        data = json.loads(match.group(1))
        return data['table']['rows']

# Updated ALL_MEMBERS list (from server.py)
ALL_MEMBERS_NAMES = [
    "Jahidul", "Sabit", "Komal", "Hasibul", "Shourav", "Roni", 
    "Sushant", "Sammi", "Samia", "Pinky", "Reza", "Aritri", "Robel", "Sobuz", "Istiak Ahmed", "Wakil", "Rasel", "Gazi Fahim",
    "Rezwan", "Jobaeid", "Harun", "Babu", "Akash", "Sifat", "Imran", "Tihim",
    "Alamin", "Ibrahim", "Raj", "Turjo", "Saiful", "Romjan", "Istiak"
]

MEMBER_LOOKUP = {n.lower(): n for n in ALL_MEMBERS_NAMES}
MEMBER_LOOKUP["istak"] = "Istiak"
MEMBER_LOOKUP["istak ahamed"] = "Istiak"

def norm_token(t):
    t = re.sub(r"\([^)]*\)", "", str(t or ""))
    t = re.sub(r"\b\d+%?\b", "", t)
    t = re.sub(r"%", "", t)
    t = re.sub(r"\s+", " ", t).strip(" -")
    return t.strip()

def audit_sharing():
    rows = get_sheet_data()
    if not rows: return

    tracked_delivered = 0.0
    lost_delivered = 0.0
    tracked_wip = 0.0
    lost_wip = 0.0

    for r in rows[1:]:
        c = r['c']
        if not c: continue
        
        status = str(c[19]['v'] if len(c)>19 and c[19] else '').strip()
        service = str(c[20]['v'] if len(c)>20 and c[20] else '').upper()
        assign = str(c[18]['v'] if len(c)>18 and c[18] else '').strip()
        
        if not ('SEO' in service or 'SMM' in service): continue
        if status not in ["Delivered", "WIP", "Revision"]: continue

        amount = 0.0
        try:
            if len(c)>23 and c[23] and 'v' in c[23]:
                amount = float(c[23]['v'])
        except: pass

        # Sharing Logic
        parts = [p.strip() for p in re.split(r"[/,]", assign)]
        tokens = []
        for p in parts:
            tk = norm_token(p).lower()
            if tk: tokens.append(tk)
        
        num_assigned = len(tokens) if tokens else 1
        share = amount / num_assigned

        for tk in tokens:
            if tk in MEMBER_LOOKUP:
                if status == "Delivered": tracked_delivered += share
                else: tracked_wip += share
            else:
                if status == "Delivered": lost_delivered += share
                else: lost_wip += share
        
        if not tokens: # No names at all?
            if status == "Delivered": lost_delivered += amount
            else: lost_wip += amount

    print(f"Revenue Audit (Member-Share Logic):")
    print(f"  Delivered (Tracked): ${tracked_delivered:,.2f}")
    print(f"  Delivered (Lost/Untracked): ${lost_delivered:,.2f}")
    print(f"  ---")
    print(f"  WIP (Tracked):       ${tracked_wip:,.2f}")
    print(f"  WIP (Lost/Untracked): ${lost_wip:,.2f}")
    
    print(f"\nDiscrepancy Check:")
    print(f"  WIP Dashboard expects ${tracked_wip:,.2f}")
    print(f"  WIP Audit found ${tracked_wip + lost_wip:,.2f}")
    print(f"  Missing WIP: ${lost_wip:,.2f}")

if __name__ == "__main__":
    audit_sharing()
