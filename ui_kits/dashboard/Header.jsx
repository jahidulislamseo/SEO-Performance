// Header.jsx — SEO Performance Hub sticky header
// Exports: Header

const Header = ({ dept = "GEO Rankers", month = "April 2026", onRefresh, onManagerView }) => {
  const [time, setTime] = React.useState('');
  const [theme, setThemeState] = React.useState('dark');

  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return React.createElement('header', { className: 'hdr' },
    React.createElement('div', { className: 'hl' },
      React.createElement('div', { className: 'logo' }, '🌍'),
      React.createElement('div', { className: 'ht' },
        React.createElement('h1', null, 'SEO Performance Hub'),
        React.createElement('p', null, `${dept} Department · ${month}`)
      )
    ),
    React.createElement('div', { className: 'hdr-center' },
      React.createElement('button', {
        className: 'theme-btn',
        onClick: toggleTheme,
        title: 'Toggle theme'
      }, theme === 'dark' ? '☀️' : '🌙')
    ),
    React.createElement('div', { className: 'hr' },
      React.createElement('div', { className: 'live-badge' },
        React.createElement('div', { className: 'ldot' }),
        React.createElement('span', null, 'Live')
      ),
      React.createElement('button', { className: 'hbtn manager', onClick: onManagerView },
        '👤 ', React.createElement('span', null, 'Manager View')
      ),
      React.createElement('button', { className: 'hbtn yellow' }, '📊 ', React.createElement('span', null, 'CSV')),
      React.createElement('button', { className: 'hbtn green' }, '🖨️ ', React.createElement('span', null, 'PDF')),
      React.createElement('button', { className: 'hbtn', onClick: onRefresh }, '↻ ', React.createElement('span', null, 'Refresh')),
      React.createElement('div', { className: 'clock' }, time)
    )
  );
};

Object.assign(window, { Header });
