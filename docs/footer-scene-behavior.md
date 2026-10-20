# Footer final — bloco de funcionamento

## Escopo deste bloco

A seção preta posterior ao FakeFooter permanece na sequência original. O vídeo só aparece quando ela cobre toda a área visível. O loading existente precisa terminar antes de qualquer ativação.

Este bloco conecta reprodução, bloqueio temporário, contagem e retorno. A composição usa personagem centralizado e contido em até 65% da altura visível no desktop e 60% no mobile. Fragmentos de código e erros fictícios acompanham o gesto no notebook; perspectiva do mouse e troca do ícone da aba não fazem parte deste ajuste.

## Ciclo

1. Na aproximação, preparar a mídia sem revelar personagem ou poster.
2. Na cobertura completa da área visível, adquirir o bloqueio nativo e suspender a inércia do Lenis.
3. Reservar uma das duas vagas entre abas, sem alterar a contagem. Só então tentar o vídeo com áudio. Caso o navegador negue autoplay audível, repetir em silêncio.
4. O evento `playing` revela a cena sem pausar e reiniciar a mídia. Contabilizar somente depois de um quadro apresentado com tempo positivo, dimensões válidas e mídia em reprodução; `playing`, carregamento e buffering isoladamente não consomem execução. A confirmação usa `requestVideoFrameCallback` ou, na ausência dessa API, `timeupdate` com mídia decodificada e tempo avançando.
5. Durante o vídeo, impedir rolagem e navegação interna. Não bloquear os controles do próprio navegador. Não existe botão de pular ou saída por Escape.
6. Usar o tempo dos quadros apresentados para os marcadores de cena; quando a API de quadros não existe, usar `currentTime` em `timeupdate`.
7. Ao término, manter preto, devolver documento e Lenis ao topo sem recarregar a página, revelar a Hero e remover os bloqueios.
8. Rearmar somente depois de sair da seção. Depois das duas execuções, deixar apenas a seção preta, sem vídeo, controles ou retorno forçado.

## Persistência

Chave local: `moreiragabryel:footer-scene:v1`.

Limite: duas reproduções com apresentação confirmada por armazenamento do site nesse navegador/perfil. A contagem continua entre visitas e é reiniciada quando os dados locais correspondentes são apagados. Limpar apenas o cache de arquivos não necessariamente remove esse armazenamento. Valores gravados pelo fluxo anterior não são apagados ou presumidos inválidos automaticamente.

Uma transação de escrita IndexedDB coordena reserva, confirmação e liberação entre abas, inclusive em HTTP na LAN. Esse banco funciona somente como mutex: a contagem continua exclusivamente na chave local indicada acima. A chave auxiliar `moreiragabryel:footer-scene:v1:pending` mantém vagas temporárias, não execuções. Vagas pendentes somadas à contagem nunca podem superar duas; falha, cancelamento ou ocultação antes da confirmação liberam a vaga sem incrementar o contador. Reservas abandonadas expiram em 12 segundos, acima do prazo de oito segundos para confirmar a apresentação. Se a coordenação for bloqueada, a cena não é liberada e a rolagem é restaurada, sem ignorar o limite entre abas.

Se o navegador negar a leitura ou escrita do armazenamento, aplicar o limite em memória para a página atual; nessa condição não é possível garantir persistência após fechar ou recarregar.

Para repetir a avaliação manual, fechar outras abas dessa origem, remover apenas as chaves desta cena pelo console do navegador e recarregar:

```js
localStorage.removeItem('moreiragabryel:footer-scene:v1');
localStorage.removeItem('moreiragabryel:footer-scene:v1:pending');
location.reload();
```

Não existe um parâmetro público de URL nem um controle de produção para ignorar o limite.

## Recuperação

- Uma aba oculta pausa mídia, callbacks de quadro e os tempos de encerramento. Antes da confirmação, sua reserva é liberada e a retomada reserva novamente, sem contar a tentativa interrompida. Depois da confirmação, a propriedade da execução é preservada; retomar não consome outra execução.
- Uma falha de mídia, oito segundos visíveis sem confirmação ou oito segundos sem avanço após a confirmação encerram a tentativa sob preto e liberam a página. Uma falha anterior à apresentação não incrementa o contador.
- Navegação real do navegador / page cache cancela a execução e restaura os recursos; restaurar a mesma chegada não dispara imediatamente outra cena.
- Desmontagem remove eventos, callbacks, timers, flags e bloqueios.
- O Lenis só é reiniciado se estava rodando antes do primeiro bloqueio e nenhum dialog de tecnologia ainda possui um bloqueio.

## Interferência visual

- Uma timeline GSAP permanece pausada e recebe somente o tempo do quadro apresentado, pelo `onTime` do controlador existente. Não há relógio independente nem timers de glitch.
- Os títulos, mensagens explicativas e cartões de erro foram removidos. Desde a entrada há oito fluxos sobrepostos de código, stack traces e dumps de memória cenográficos; no mobile aparecem seis. Não são logs coletados do navegador, não expõem dados reais e nenhum trecho é executado ou lançado como exceção.
- Os fluxos usam cópias iguais para deslocamento vertical contínuo, aceleram no marcador de 6,4 segundos e se desalinham antes do colapso. Camadas centrais têm opacidade menor para preservar a silhueta do personagem; não existem molduras, fundos de terminal ou painéis opacos.
- Interferência leve e cortes do personagem começam em 0,35 segundo. Sete perdas escuras e breves de sinal atingem a composição inteira, desde 0,65 segundo, com espaçamento deliberado e sem estrobo branco/preto contínuo. Em 6,4 segundos o tranco, as faixas e a fragmentação se intensificam junto ao ataque.
- Um canvas de 720×1148 copia o quadro decodificado do único vídeo em oito faixas horizontais deslocadas. O arquivo e o áudio não são alterados e não há decodificadores extras. Se o canvas não estiver disponível ou a cópia falhar, o vídeo original continua visível com os efeitos CSS/GSAP.
- Em 8,85 segundos a composição recua. Em 9,09 ela se comprime verticalmente; em 9,41 a linha restante fecha no centro e desaparece até 9,65. O apagão e a barreira de restauração do controlador continuam independentes e inalterados.
- Somente após o controlador confirmar a restauração e entrar em `revealing`, o fundo da Hero acomoda um zoom e o letreiro um deslocamento curto durante os mesmos 240ms da revelação. Propriedades CSS individuais preservam os transforms de scroll/mouse; o marcador é removido ao sair do estado ou desmontar. Não há rolagem acelerada por todas as seções.
- No mobile, largura, posições e tipografia dos seis fluxos são próprias para a tela estreita; vídeo e canvas continuam limitados a 60dvh, contra 65dvh no desktop. Nenhum efeito recebe foco ou eventos de ponteiro.
- Com movimento reduzido, os códigos permanecem estáticos e há somente dissoluções suaves de opacidade, sem perdas de sinal, cortes, deslocamento, varredura ou compressão. Ocultar a aba pausa o relógio existente; desmontar reverte o contexto GSAP e remove o listener da preferência.
- Os arquivos de vídeo, RGB, alfa e áudio permanecem inalterados; a redução é apenas de apresentação CSS.

## Mídia

Original preservado: `public/media/footer.webm`.

Derivados usados na reprodução: `footer-character.webm` (alfa) e `footer-character.mp4` (composição preta de compatibilidade). `footer-character-media.json` registra o processamento e as verificações reais. O poster limpo não é exibido na entrada para não antecipar o personagem já formado.

A entrada mantém os fragmentos originais e o refinamento aprovado. Não substituir por partículas geradas nem remover tudo que for branco. O recorte é conservador nas áreas internas protegidas da camiseta.

## Avaliação manual pendente

1. Desktop: chegar lentamente à seção; nada deve ser revelado enquanto ainda houver parte do FakeFooter visível.
2. Durante a reprodução: testar roda do mouse, teclas de rolagem e links internos, sem conseguir abandonar a cena por eles.
3. Conferir áudio quando permitido e reprodução em silêncio quando bloqueado.
4. Conferir apagão, retorno à Hero, rolagem e cliques funcionando sem loading novo.
5. Descer de novo para a segunda execução. Na terceira chegada, deve haver somente preto e rolagem livre.
6. Repetir em celular vertical e horizontal, conferindo personagem/notebook contidos, ausência de interação por dedo e retorno ao topo.
7. Trocar de aba durante a reprodução e durante o apagão; retomar sem duplicar a contagem.
8. Conferir invasão de código desde a aparição, perdas escuras de sinal espaçadas, aceleração e cortes no gesto, tamanho do personagem e colapso antes do retorno. Com movimento reduzido, verificar códigos estáticos, ausência de piscadas e deslocamentos.
9. Firefox: conferir que `playing` sozinho não incrementa o contador, que uma falha anterior ao primeiro quadro libera a reserva e que abas simultâneas não ultrapassam duas vagas entre reservas e execuções confirmadas.

Testes em Node/VM e build não equivalem a aprovação visual ou validação de autoplay em todos os aparelhos.
