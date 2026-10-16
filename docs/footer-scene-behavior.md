# Footer final — bloco de funcionamento

## Escopo deste bloco

A seção preta posterior ao FakeFooter permanece na sequência original. O vídeo só aparece quando ela cobre toda a área visível. O loading existente precisa terminar antes de qualquer ativação.

Este bloco conecta reprodução, bloqueio temporário, contagem e retorno. A quebra visual do layout, os códigos e a perspectiva do mouse pertencem ao próximo bloco visual. A troca do ícone da aba continua como uma entrega independente posterior.

## Ciclo

1. Na aproximação, preparar a mídia sem revelar personagem ou poster.
2. Na cobertura completa da área visível, adquirir o bloqueio nativo e suspender a inércia do Lenis.
3. Tentar o vídeo com áudio. Caso o navegador negue autoplay audível, repetir em silêncio.
4. No primeiro evento real `playing`, pausar e manter preto enquanto a admissão entre abas é coordenada. Contabilizar apenas essa reprodução iniciada, não a chegada nem o buffering, e liberar a cena somente após a admissão.
5. Durante o vídeo, impedir rolagem e navegação interna. Não bloquear os controles do próprio navegador. Não existe botão de pular ou saída por Escape.
6. Usar o tempo dos quadros apresentados para os marcadores de cena; quando a API de quadros não existe, usar `currentTime` em `timeupdate`.
7. Ao término, manter preto, devolver documento e Lenis ao topo sem recarregar a página, revelar a Hero e remover os bloqueios.
8. Rearmar somente depois de sair da seção. Depois das duas execuções, deixar apenas a seção preta, sem vídeo, controles ou retorno forçado.

## Persistência

Chave local: `moreiragabryel:footer-scene:v1`.

Limite: duas reproduções iniciadas por armazenamento do site nesse navegador/perfil. A contagem continua entre visitas e é reiniciada quando os dados locais correspondentes são apagados. Limpar apenas o cache de arquivos não necessariamente remove esse armazenamento.

Uma transação de escrita IndexedDB coordena as admissões entre abas. Esse banco funciona somente como mutex: a contagem continua exclusivamente na chave local indicada acima. Se a coordenação for bloqueada, a cena não é liberada e a rolagem é restaurada, sem ignorar o limite entre abas.

Se o navegador negar a leitura ou escrita do armazenamento, aplicar o limite em memória para a página atual; nessa condição não é possível garantir persistência após fechar ou recarregar.

Para repetir a avaliação manual, remover apenas essa chave pelo console do navegador e recarregar:

```js
localStorage.removeItem('moreiragabryel:footer-scene:v1');
location.reload();
```

Não existe um parâmetro público de URL nem um controle de produção para ignorar o limite.

## Recuperação

- Uma aba oculta pausa mídia, callbacks de quadro e os tempos de encerramento. Retomar não consome outra execução.
- Uma falha de mídia ou oito segundos visíveis sem avanço encerram a tentativa sob preto e liberam a página.
- Navegação real do navegador / page cache cancela a execução e restaura os recursos; restaurar a mesma chegada não dispara imediatamente outra cena.
- Desmontagem remove eventos, callbacks, timers, flags e bloqueios.
- O Lenis só é reiniciado se estava rodando antes do primeiro bloqueio e nenhum dialog de tecnologia ainda possui um bloqueio.

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
8. Conferir preferência de movimento reduzido e ausência de efeitos extras intensos neste bloco.

Testes em Node/VM e build não equivalem a aprovação visual ou validação de autoplay em todos os aparelhos.
