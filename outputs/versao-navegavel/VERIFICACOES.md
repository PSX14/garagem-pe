# Conferência da entrega — 16/10/2026

Esta atualização organiza a documentação e cinco capturas existentes. Não altera o código do aplicativo.

| Verificação executada hoje | Resultado |
| --- | --- |
| `npm.cmd ci` | Aprovada; 976 pacotes instalados |
| `npm.cmd run check` | Aprovada; 239 verificações estruturais |
| `npm.cmd run typecheck` | Aprovada |
| `npm.cmd run lint` | Aprovada; sem avisos |
| `npm.cmd run doctor` | Aprovada; 21/21 verificações |
| `npm.cmd run bundle:android` | Aprovada; bundle Android exportado |
| `npm.cmd run test` | Bloqueada pelo ambiente antes de executar os testes: `EPERM` em `realpathSync.native` |
| `npm.cmd run check:dependencies` | Reprovada na consulta atual de compatibilidade: novas versões de correção recomendadas |

**Não houve aprovação integral de `npm run verify` nesta conferência.** A sequência passou por estrutura, tipagem e lint e parou na inicialização do Jest. Doctor e bundle foram executados separadamente e aprovados.

## Pendências identificadas

- **Jest:** o Windows negou a resolução nativa da pasta temporária. A tentativa com uma pasta temporária dentro de `work/versao-navegavel/` também retornou `EPERM`. É necessário repetir os testes em um terminal com acesso normal às pastas do projeto e temporários. Nenhum teste foi modificado ou desativado.
- **Compatibilidade:** a primeira consulta esbarrou no acesso ao cache global do Expo. A nova consulta com `EXPO_NO_CACHE=1` funcionou e recomendou: Expo `~57.0.30`, expo-asset `~57.0.20`, expo-file-system `~57.0.7`, expo-font `~57.0.4`, expo-image-picker `~57.0.20`, expo-location `~57.0.21` e jest-expo `~57.0.6`. Essas atualizações devem ser aplicadas e verificadas em uma rodada própria, incluindo regressão Android; não foram misturadas à organização documental desta entrega.

## Evidência anterior

A aprovação de 164 testes em dez suítes, a execução dos fluxos no Expo Go Android e a persistência após reinício pertencem a **09/09/2026**, conforme o [relatório original](../RELATORIO-VALIDACAO.md). Um teste adicional do mapa foi incluído posteriormente na preparação para APK. Os resultados antigos não são apresentados como execução da suíte atual.

As cinco imagens desta pasta são capturas reais daquela execução Android. Nenhuma nova sessão Android foi executada nesta atualização documental.
