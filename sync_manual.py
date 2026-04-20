import os
import re
import time
import pandas as pd
from pymongo import UpdateOne
from shared_utils import get_db, COL, safe_float, normalize_name, parse_gviz_date
import agent_engine

def sync_manual():
    print("Starting Manual Sync from manual_data.txt...")
    db = get_db()
    
    with open('manual_data.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    manual_projects = []
    for line in lines:
        if not line.strip(): continue
        parts = line.split('\t')
        # Ensure we have enough columns
        if len(parts) <= max(COL.values()):
            # Pad with empty strings if needed
            parts += [''] * (max(COL.values()) - len(parts) + 1)
            
        order_num = parts[COL['order_num']].strip()
        if not order_num or order_num == 'N/A': continue
        
        proj = {
            "order_num": order_num,
            "date": parts[COL['date']].strip(),
            "client": parts[COL['client']].strip(),
            "order_link": parts[COL['order_link']].strip(),
            "assign": parts[COL['assign']].strip(),
            "status": parts[COL['status']].strip(),
            "service": parts[COL['service']].strip(),
            "del_by": parts[COL['del_by']].strip(),
            "del_date": parts[COL['del_date']].strip(),
            "amount_x": safe_float(parts[COL['amount_x']]),
            "last_updated": time.time()
        }
        manual_projects.append(proj)
    
    print(f"Parsed {len(manual_projects)} projects from file.")
    
    if manual_projects:
        # 1. Update Projects collection
        ops = []
        for p in manual_projects:
            ops.append(UpdateOne({"order_num": p["order_num"]}, {"$set": p}, upsert=True))
        
        if ops:
            res = db["projects"].bulk_write(ops)
            print(f"Updated Projects: {res.upserted_count} new, {res.modified_count} modified.")
        
        # 2. Trigger Calculation Engine
        # We need to make sure agent_engine uses these projects.
        # Since agent_engine.calculate_summaries calls get_raw_dataframe, 
        # which fetches from Sheets, we need a way to override it.
        
        print("Recalculating summaries based on updated database...")
        # Monkey patch get_raw_dataframe to use our manual projects
        original_get_raw = agent_engine.get_raw_dataframe
        
        def mock_get_raw():
            # Convert manual_projects to DataFrame in the format expected
            # (which matches the sheet columns)
            data = []
            for p in manual_projects:
                row = [''] * 30
                row[COL['order_num']] = p['order_num']
                row[COL['date']] = p['date']
                row[COL['client']] = p['client']
                row[COL['order_link']] = p['order_link']
                row[COL['assign']] = p['assign']
                row[COL['status']] = p['status']
                row[COL['service']] = p['service']
                row[COL['del_by']] = p['del_by']
                row[COL['del_date']] = p['del_date']
                row[COL['amount_x']] = p['amount_x']
                data.append(row)
            return pd.DataFrame(data, columns=[str(i) for i in range(30)])
            
        # Temporarily swap the function
        # agent_engine.get_raw_dataframe = mock_get_raw
        # agent_engine.calculate_summaries()
        # agent_engine.get_raw_dataframe = original_get_raw
        
        # Actually, let's just run calculate_summaries directly. 
        # To make it truly match ONLY the manual data, we should probably 
        # clear the projects collection first or handle the DF carefully.
        
        # Re-running calculation with the manual data only:
        df = mock_get_raw()
        # Rename columns to match what agent_engine expects
        df = df.rename(columns={
            str(COL['order_num']): 'order_num',
            str(COL['date']): 'date',
            str(COL['client']): 'client',
            str(COL['order_link']): 'order_link',
            str(COL['assign']): 'assign',
            str(COL['status']): 'status',
            str(COL['service']): 'service',
            str(COL['del_by']): 'del_by',
            str(COL['del_date']): 'del_date',
            str(COL['amount_x']): 'amount_x'
        })
        
        # Now call the internal processing logic of agent_engine
        agent_engine.process_and_save(df, db)
        
    print("Manual Sync and Calculation Complete.")

if __name__ == "__main__":
    sync_manual()
