---
description: how to save changes and update the live website
---

Follow these steps to save your work and update your portfolio:

1. **Check your changes**
   ```powershell
   git status
   ```

2. **Stage and save your work**
   // turbo
   ```powershell
   git add .
   git commit -m "your description of changes"
   ```

3. **Push to the live server**
   // turbo
   ```powershell
   git push origin main
   ```

> [!TIP]
> Once you run `git push`, most hosting providers (like Vercel) will automatically detect the change and start building your new site. You can check the progress on your Vercel or GitHub dashboard.
