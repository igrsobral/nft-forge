module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --host 127.0.0.1 --port 4472 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://127.0.0.1:4472/', 'http://127.0.0.1:4472/nfts/nft_01'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/desktop',
    },
  },
}
