---
description: how to save changes and update the live website
---

Follow these steps to save your work and update your portfolio:

1. **Create a feature branch**
   Since your `main` branch is protected, you need to work in a separate branch first:
   ```powershell
   git checkout -b update-portfolio
   ```

2. **Sync and Stage**
   ```powershell
   git pull --rebase origin main
   git add .
   git commit -m "your description"
   ```

3. **Push and Create PR**
   ```powershell
   git push origin update-portfolio
   ```
   After pushing, go to [GitHub](https://github.com/taihaole23/ericzhong-portfolio) and click **"Compare & pull request"** to merge your changes into `main`.

> [!TIP]
> Once you run `git push`, most hosting providers (like Vercel) will automatically detect the change and start building your new site. You can check the progress on your Vercel or GitHub dashboard.
