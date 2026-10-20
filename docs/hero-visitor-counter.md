# Contador de entradas na Hero

## Comportamento aprovado

- Desktop e mobile: ícone de perfil e número discreto no canto inferior esquerdo da Hero.
- Uma entrada por carregamento do documento, depois do loader e com a Hero e a aba visíveis.
- F5/nova página registra outra entrada. Retorno do vídeo, remontagem React, StrictMode e mudança de idioma não registram outra entrada no mesmo documento.
- A animação GSAP troca o total anterior pelo novo total retornado pelo servidor. Não há número fictício inicial, polling ou histórico de visitantes.
- Reduced motion mostra diretamente o total final. Saída da Hero, aba oculta e desmontagem liberam a animação; ela não reinicia ao voltar.
- O rótulo acessível é traduzido em PT/EN. O ícone e os números animados são decorativos para leitores de tela.
- Sem API ou com erro de rede, o indicador não aparece. O site e sua navegação continuam funcionando; não há repetição automática de uma escrita incerta.

Este critério conta entradas, não pessoas únicas. Não identifica visitantes nem separa humanos de automações que executem a página.

## Armazenamento

`public/_worker.js` atende `POST /api/visits`, exclusivamente da mesma origem. O binding D1 é `VISITOR_COUNTER_DB`.

A aplicação cria automaticamente uma tabela `visitor_count` com uma única linha `{id: 1, total: N}`. Uma transação executa o incremento SQL atômico e retorna `{previous, total}`. Não há tabela de eventos, IPs, cookies, fingerprint, identificadores de visitantes ou localStorage/sessionStorage para este recurso. A única memória de página é a promessa da requisição já realizada, para impedir incrementos duplicados no mesmo documento.

A contagem começa com o primeiro POST válido ao banco configurado; não recupera visitas históricas. Novos deploys devem reutilizar o mesmo banco. Não apague a linha ou troque de banco para publicar uma nova versão.

`run_worker_first: ["/api/*"]` em `wrangler.jsonc` restringe o Worker ao endpoint do contador; os demais caminhos continuam estáticos. O Worker também preserva o encaminhamento `env.ASSETS.fetch(request)` como fallback. Nenhuma chave é incluída no frontend ou exigida para compilar.

## Prévia sem build

O build de produção está aguardando aprovação visual. Para testar a implementação em desenvolvimento, em dois terminais:

    npm run dev:counter
    npm run dev -- --host 0.0.0.0 --port 4177 --strictPort

- Vite encaminha `/api/visits` ao Miniflare em `127.0.0.1:8788`, preservando a origem.
- Miniflare executa o Worker real e o D1 local; não é uma resposta simulada.
- O total local fica em `.wrangler/visitor-counter/`, já ignorado pelo Git.
- Essa contagem local é separada da produção. Testes automatizados usam bancos próprios e temporários.
- O servidor estático anterior não é substituído nem atualizado por esta prévia.
- `npm run test:counter` executa os testes focados sem gerar `dist`.

Miniflare é somente uma dependência de desenvolvimento. Os overrides de `undici` e `sharp` são restritos a essa dependência e usam versões corrigidas apontadas pela auditoria.

## Configuração única na Cloudflare Pages — após aprovação visual

1. Crie um banco D1 na sua conta, por exemplo `portfolio-visitor-counter`.
2. No projeto Pages, abra Settings > Bindings > Add > D1 database binding.
3. Use exatamente `VISITOR_COUNTER_DB` como nome da variável e selecione o banco criado para o ambiente de produção.
4. Depois da aprovação visual, gere o build habitual. O Vite copia `_worker.js` de `public/` para a raiz de `dist/` junto aos assets.
5. Publique o conteúdo completo de `dist/`, incluindo esses dois arquivos. O `_worker.js` em advanced mode é compatível com a integração Git, Wrangler e upload direto pelo painel; não é uma pasta `functions/` que precise ser compilada durante o upload.
6. Refaça o deploy após adicionar ou alterar o binding, para que ele entre em vigor. O domínio personalizado usa a mesma API de origem da página.
7. Abra o site e confira a primeira entrada. A tabela será criada pelo Worker; não é necessário executar SQL de inicialização.

Não copie `.wrangler/` para a Cloudflare. Use banco separado se quiser habilitar o contador também em deploys de preview sem inflar a contagem pública.

Sem binding, o endpoint retorna 503 e o indicador fica oculto; isso não deve ser interpretado como total zero. A configuração do banco e o deploy pertencem ao usuário; não foram executados pelo agente.

## Validação manual pendente

1. No desktop e no celular, confira tamanho, contraste, canto inferior esquerdo e a troca do número, sem mover a frase ou a seta.
2. Recarregue: deve somar exatamente uma entrada e mostrar a troca real de N para N+1.
3. Role para fora da Hero e volte: não deve somar nem repetir a animação.
4. Troque PT/EN e, quando disponível, faça o retorno do vídeo final: o total da mesma página deve permanecer igual.
5. Com reduced motion, deve aparecer diretamente o número final, sem deslocamento.

Os testes de código e a entrega HTTP não substituem essa aprovação visual. Não foram utilizados agentes, automação de navegador ou capturas do site. Não há skill Taste na worktree; a implementação segue os tokens e a composição existentes e o workflow incremental de UI.

## Referências oficiais

- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
