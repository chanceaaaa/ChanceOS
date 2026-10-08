# Chance OS

A browser desktop with windows, a file system, a terminal, games, and apps. Everything runs in your browser tab.

## Credit

Chance OS is a fork of [YukiOS](https://github.com/Reeyuki/YukiOS) by Reeyuki, used under the MIT License. The original
copyright and license notice are kept in [LICENSE](LICENSE). The original README is kept as
[UPSTREAM_README.md](UPSTREAM_README.md). Thank you to Reeyuki and the YukiOS contributors.

## What is different from YukiOS

- Renamed to Chance OS in the interface.
- Added Snake and Memory Match, both written from scratch, with saved best scores.
- Removed analytics, advertising, the update nag, and the donation popups. The About screen credits the original project.

## Run it

```bash
cd webos-desktop
pnpm install
pnpm dev
```

Build for hosting with `pnpm build:dev` or `pnpm build`, then upload the `dist` folder to a static host such as Netlify or
GitHub Pages. The repo includes a `netlify.toml`.

## Notes

- Many bundled games and assets load from third-party CDNs that this project does not control. If one stops working,
  that source is the reason.
- Some games and emulator content come from the upstream project. Check that you have the right to use any game you add.
- Follow your school's or workplace's rules about what you run on their network.

## License

MIT. See [LICENSE](LICENSE).
