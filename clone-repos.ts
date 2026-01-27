import { $ } from 'bun'

const repositories = [
  {
    repo: 'https://github.com/Effect-TS/effect.git',
    tag: 'effect@3.19.15',
    path: '.context/effect'
  }
]

for (const { repo, tag, path } of repositories) {
  await $`git clone --depth 1 --branch ${tag} ${repo} ${path}`
}

console.log('Repositories cloned successfully.')
