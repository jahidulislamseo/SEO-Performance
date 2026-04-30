import paramiko
import sys

def get_summary(ip, user, pw):
    try:
        print(f"Connecting to {ip}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pw, timeout=10)
        
        commands = {
            "OS": "cat /etc/os-release | grep PRETTY_NAME",
            "Uptime": "uptime",
            "Memory": "free -h",
            "Disk": "df -h /",
            "CPU": "nproc",
            "Processes": "ps aux | grep -E 'python|node|nginx' | grep -v grep",
            "Ports": "netstat -tuln",
            "Services": "systemctl list-units --type=service --state=running | grep -E 'nginx|seo|mongo'"
        }
        
        summary = f"Summary for {ip}:\n"
        for label, cmd in commands.items():
            stdin, stdout, stderr = client.exec_command(cmd)
            summary += f"\n--- {label} ---\n{stdout.read().decode()}"
            
        print(summary)
        client.close()
    except Exception as e:
        print(f"Error connecting to {ip}: {e}")

if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else "134.209.219.70"
    get_summary(ip, "root", "JahiDul90@jf")
