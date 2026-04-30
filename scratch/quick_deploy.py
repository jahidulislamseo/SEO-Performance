import paramiko

def restart_only():
    """Just restart the service - useful when VPS has the latest files already."""
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(ip, username=user, password=pw, timeout=30)
        print("Connected!")
        
        def run(cmd):
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode(errors='replace')
            err = stderr.read().decode(errors='replace')
            if out.strip(): print("OUT:", out.strip())
            if err.strip(): print("ERR:", err.strip())
            return out, err
        
        # Upload just the updated api/index.py via SFTP
        print("Uploading api/index.py...")
        sftp = client.open_sftp()
        sftp.put("api/index.py", "/var/www/seo-performance/api/index.py")
        sftp.close()
        print("Uploaded!")
        
        # Restart service
        run("systemctl restart seo-dashboard")
        print("Service restarted!")
        
        client.close()
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    restart_only()
