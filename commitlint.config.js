// Enforces Conventional Commits, e.g.:
//   feat: add NFT detail page
//   fix(cart): clear coupon after checkout
//   chore: update biome config
export default {
  extends: ['@commitlint/config-conventional'],
}
