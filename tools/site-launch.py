# Launch day: swap the website's two "Coming soon to the App Store" buttons for Apple's badge linked to the game.
# Run from the repo root: python3 tools/site-launch.py, then copy site/ to the castledefense-site repo and push.
import re
p = 'site/index.html'; s = open(p).read()
badge = '<a class="badge" href="https://apps.apple.com/app/id6832629905"><img src="/img/appstore-badge.svg" alt="Download on the App Store" width="162" height="54"></a>'
s, n = re.subn(r'<span class="store">.*?</b></span></span>', badge, s, flags=re.S)
s = s.replace('  <!-- APP_STORE: once the game is live, make this an <a> to the App Store page with Apple\'s own "Download on the App Store" badge -->\n', '')
open(p, 'w').write(s); print('buttons swapped:', n)
