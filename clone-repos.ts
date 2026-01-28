import { $ } from 'bun'

const repositories = [
  {
    repo: 'https://github.com/Effect-TS/effect.git',
    tag: 'effect@3.19.15',
    path: '.context/effect'
  },
  {
    repo: 'https://github.com/landuci/dynmail.git',
    tag: 'v1.0.6',
    path: '.context/dynmail'
  }
]

for (const { repo, tag, path } of repositories) {
  await $`git clone --depth 1 --branch ${tag} ${repo} ${path}`.nothrow()
}

console.log('Repositories cloned successfully.')
