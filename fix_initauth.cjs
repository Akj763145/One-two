const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  useEffect(() => {
    initAuth(
      (user, token) => {
        setGoogleUser(user);
        // @ts-ignore
        window.googleAccessToken = token;
      },
      () => {
        setGoogleUser(null);
        // @ts-ignore
        window.googleAccessToken = null;
      }
    );
  }, []);`;

const fix = `  useEffect(() => {
    if (isAdmin) {
      initAuth(
        (user, token) => {
          setGoogleUser(user);
          // @ts-ignore
          window.googleAccessToken = token;
        },
        () => {
          setGoogleUser(null);
          // @ts-ignore
          window.googleAccessToken = null;
        }
      );
    }
  }, [isAdmin]);`;

code = code.replace(target, fix);
fs.writeFileSync('src/App.tsx', code);
