# Working in this repo

## What is not here

This repo is the real estate site only: huntergroupremax.com, with its home
page, buying and selling guides, and mortgage pages. The funds portal (Equity
Market, formerly Hunter & Hunter Investment Advisors) is a separate business in
its own repo, **github.com/jackhunterking/equity-market**. Portal work, and
anything about the funds, their offerings or investors, belongs there. Don't
bring portal code back into this repo; the site links out to the portal through
`lib/portal-link.ts`.

## Social media

Jack Hunter social media work (a post, a caption, a carousel, a building
post, a week's batch, a hook rewrite, anything destined for Instagram, Facebook
or LinkedIn) is done in the equity-market repo, through its **`turkiye-social`**
skill. That skill replaced the `hunter-social` skill that used to live here, and
it sits beside the building data and the render pipeline in `scripts/social/`
that the posts are drawn from. Don't draft posts from this repo: open that one.

This does not cover Jack ve Tara (Turkish, separate business). That has its
own skill.
