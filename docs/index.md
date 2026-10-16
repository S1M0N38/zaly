---
layout: home

hero:
  name: zaly
  text: Hackable terminal coding agent.
  tagline: Work with an AI agent in your terminal, with persistent sessions, explicit permissions, and room to make it your own.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/folke/zaly

features:
  - title: Stay in the conversation
    details: Steer ongoing work without interrupting active tools. Inspect context, resume sessions, and keep long-running tasks moving.
  - title: Choose your model
    details: Authenticate with supported providers using API keys or supported login flows, including OpenAI Codex with a ChatGPT subscription.
  - title: Make it yours
    details: Add project instructions, commands, templates, skills, plugins, and themes.
---

::: warning Alpha software
zaly is useful today, but APIs, configuration, session formats, and behavior can
change before 1.0. These docs target the current repository; installed releases
may differ. Linux and macOS are the tested platforms. Windows is untested.
:::

::: code-group

```sh [bun]
bun add -g @zaly/cli
```

```sh [npm]
npm install -g @zaly/cli
```

```sh [pnpm]
pnpm add -g @zaly/cli
```

:::

```sh
cd your-project
zaly
```
