# Publicação mínima na Cloudflare Pages

## Branches

- `main`: projeto de desenvolvimento, fontes, testes e documentação pública revisada.
- `main-build`: somente o pacote pronto, com histórico independente. Não executar `npm install` ou `npm run build` nesse ramo; ele já contém o resultado compilado.
- As outras branches e o histórico público permanecem existentes. O ramo de deploy não torna privado o restante do repositório.

## O que entra no pacote

`index.html`, chunks JS/CSS em `assets/`, arquivos públicos efetivamente referenciados pelo código/HTML/CSS, favicon, `_headers`, `_redirects`, `_routes.json`, `_worker.js` e `THIRD_PARTY_NOTICES.txt`.

Não entram fontes TypeScript/TSX, testes, documentação Markdown, dependências de desenvolvimento, bancos locais, `.env`, mapas de código-fonte, referências de produção de mídia e vídeos originais não usados. A seleção preserva caminhos dinâmicos de mídia e não modifica o conteúdo dos assets escolhidos. Nenhum arquivo pode ultrapassar 25 MiB. O empacotador recusa links simbólicos, dependências ausentes, referências a source maps, travessia de diretórios e destinos já existentes.

## Regerar a partir da main

    npm ci
    npm run verify
    npm run release:cloudflare -- build/cloudflare-release

O último comando exige uma pasta de saída nova. Não sobrescreve uma publicação anterior. Use outro nome para a próxima versão ou remova manualmente apenas uma saída antiga que você já tenha conferido.

O empacotador imprime a lista real dos arquivos mantidos e omitidos. Os avisos públicos de licença são gerados das dependências runtime instaladas; não são documentação interna da máquina.

Atualizar `main-build` é uma publicação separada: revise o pacote antes de criar o commit. Não copie `.git`, `.wrangler`, `node_modules` ou o código-fonte para essa branch. Não reescreva seu histórico sem uma decisão explícita.

## Publicar

### Upload direto

No Cloudflare Pages, faça upload do conteúdo do pacote ou do ZIP disponibilizado, com `index.html` e `_worker.js` na raiz. Não envie a pasta de fontes da main. O `_worker.js` usa advanced mode e não exige compilar uma pasta `functions/` no painel.

### Integração Git

- Selecione o repositório e `main-build` como branch de produção.
- Framework preset: None.
- Build command: `exit 0` (o pacote já foi compilado).
- Build output directory: `.` (a raiz desse ramo).
- Não configure comandos de npm para `main-build`.

Associe o domínio pelo fluxo Custom domains do próprio projeto Pages. Não aponte o DNS para seu computador ou abra portas do computador para hospedar o site. Os arquivos ficam hospedados na Cloudflare; os servidores locais de desenvolvimento não fazem parte da publicação.

## Banco do contador: uma configuração na Cloudflare

O contador global persistente requer o D1. Não é necessário enviar um arquivo de banco ou um dump SQL.

1. Crie um banco D1 na sua conta, por exemplo `portfolio-visitor-counter`.
2. No projeto Pages: Settings > Bindings > Add > D1 database binding.
3. Nome da variável: `VISITOR_COUNTER_DB`, exatamente assim.
4. Selecione o banco criado no ambiente de produção.
5. Refaça o deploy para ativar o binding.

O Worker cria a tabela na primeira entrada válida e mantém uma única linha com o total atual. Novos deploys devem reutilizar esse mesmo banco. Não há armazenamento de visitantes, cookies, IPs ou identificadores no contador; o banco local da prévia não é enviado nem usado como contagem inicial de produção.

Sem binding, a API retorna 503 e o indicador fica oculto; isso não significa total zero. As credenciais de administração do banco não são entregues ao navegador. Criar o banco, associar o domínio e executar o deploy são operações do proprietário da conta, não realizadas nesta preparação.

## Segurança e limites

- CSP restringe scripts e conexões à própria origem; permite os hosts de fontes já utilizados e estilos inline necessários à interface animada.
- `_headers` protege respostas estáticas; a API define separadamente seus próprios cabeçalhos de segurança.
- A compilação não publica source maps. Arquivos de origem, documentos internos, bancos locais e relatórios de auditoria não integram o pacote.
- Os novos commits desta preparação usam noreply. Isso não remove e-mails ou dados de commits anteriores, clones, caches ou forks.
- A ausência de achados no scanner não equivale a garantia absoluta de ausência de vulnerabilidades.
- O contador mede entradas, não pessoas únicas. Como é público e não identifica visitantes, requisições automatizadas podem inflar o total ou consumir quota. Depois de associar o domínio, considere uma regra de rate limiting/WAF para `POST /api/visits` conforme os recursos do seu plano. Não trate a validação de Origin como autenticação de robôs.
- Se restringir o acesso ao domínio principal, examine também o endereço `pages.dev` e deploys de preview; uma proteção aplicada só ao domínio personalizado não protege automaticamente todos os outros endereços.
- Não foram adicionados captcha, fingerprint ou cadastro. A segurança da conta Cloudflare, limites de consumo e permissões administrativas continuam sendo configurações da conta.

## Verificação após seu deploy

1. Confirme HTTPS e o domínio configurado no Pages.
2. Abra a Hero: a API deve responder JSON com `previous` e `total`, e o número deve animar uma única entrada.
3. Verifique o binding se o contador não aparecer; não insira uma chave no frontend para resolver 503.
4. Confirme fontes, ícones, vídeos com áudio e rotas legais no desktop e no celular.
5. Confira os cabeçalhos efetivamente recebidos. A validação local não substitui essa conferência da configuração remota.

Referências oficiais:

- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/headers/
