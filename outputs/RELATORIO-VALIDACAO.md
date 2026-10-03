# Garagem PE — relatório de validação

Atualizado em 09/09/2026. **Comandos finais, fluxos no Android, persistência, revisão visual e reabertura após o último `npm ci` aprovados nas verificações descritas abaixo.**

## Escopo entregue para verificação

Nota posterior: após as verificações históricas deste relatório, foi preparado o perfil APK em `eas.json`, com mapa local imediato e instruções em [GERAR-APK.md](GERAR-APK.md). A preparação passou em quatro testes do componente de mapa, typecheck, lint, 239 verificações estruturais e exportação Android com `EXPO_PUBLIC_MAP_MODE=local`. Isso não representa compilação ou teste de instalação de um APK; as capturas e os resultados consolidados abaixo continuam sendo evidências da entrega anterior no Expo Go.


Aplicativo acadêmico exclusivamente React Native, Expo e TypeScript strict, com interface nativa. Motorista pesquisa, filtra, reserva, acompanha, cancela quando permitido e avalia; proprietário cadastra, edita e ativa/pausa vagas privadas autorizadas, acompanha reservas e ganhos e avalia motoristas. Dados fictícios persistidos localmente com AsyncStorage; fotografias copiadas pelo Expo FileSystem. Sem frontend web, backend, autenticação real ou movimentação financeira.

## Fontes efetivamente inspecionadas

- Pedido detalhado anexado pelo usuário em 04/09/2026: `pasted-text.txt`.
- `C:\Users\Gabs\Desktop\Organizar\Faculdade\Garagem Pe\Garagem_PE_Formulario_e_Mockups.pdf`: sete páginas, lidas e renderizadas.
- No mesmo diretório: `Garagem_PE_Mockup_1_Inicio.png`, `Garagem_PE_Mockup_2_Detalhes.png`, `Garagem_PE_Mockup_3_Reserva.png`, `Garagem_PE_Mockup_4_Cadastro.png` e `Garagem_PE_Mockup_5_Painel.png`: cinco imagens 1080 × 1920 inspecionadas integralmente.
- Auditoria de referências, texto extraído, renderes e hashes preservados em `work/references/`; auditoria específica de domínio/persistência em `work/references/domain-final-audit.md`.

Decisões diante de conflitos: a comissão de 15% é **incluída** no preço anunciado e o repasse líquido é 85%, seguindo o texto explícito. O mockup 3 mostra taxa adicionada por fora; esse cálculo não foi reproduzido. A paleta hexadecimal do pedido prevalece sobre diferenças de tom dos PNGs. O limite visual de cinco fotos foi adotado para novos cadastros/edições, preservando seis fotos de estados legados sem exclusão silenciosa.

## Comandos finais

Execução consolidada em 09/09/2026, das 17:23:06 às 17:24:04 no fuso de Recife. O registro [final-gates.json](verification/final-gates.json) contém horários UTC, durações, comandos e códigos de saída. Todos os comandos abaixo terminaram com saída 0 no estado final do código.

| Comando | Situação atual | Evidência final |
| --- | --- | --- |
| `npm ci` | Aprovado; 976 pacotes instalados, 26,441 s | [install.log](verification/install.log) |
| `npm run check` | Aprovado dentro de verify; 235 verificações estruturais, 40 arquivos de aplicativo | [verify.log](verification/verify.log) |
| `npm run typecheck` | Aprovado; `tsc --noEmit` sem erros | [verify.log](verification/verify.log) |
| `npm run lint` | Aprovado; `eslint . --max-warnings=0` | [verify.log](verification/verify.log) |
| `npm test` — script `jest --runInBand` | Aprovado; 164 testes em 10 suítes | [verify.log](verification/verify.log), [resultado Jest](verification/jest-results.json) |
| `npm run check:dependencies` | Aprovado; dependências compatíveis e atualizadas | [dependencies-final.log](verification/dependencies-final.log) |
| `npm run doctor` — `expo-doctor` | Aprovado; 21/21 verificações, nenhum problema detectado | [doctor-final.log](verification/doctor-final.log) |
| `npm run bundle:android` — `expo export --platform android` | Aprovado; 774 módulos, bundle Hermes de 2,3 MB, 19 assets | [verify.log](verification/verify.log), [metadados do bundle](android-bundle/metadata.json) |
| `npm run verify` | Aprovado; sequência completa em 27,127 s, saída 0 | [verify.log](verification/verify.log), [final-gates.json](verification/final-gates.json) |

`npm run check` verifica escopo e integridade estrutural: AST de imports/JSX, dependências diretas proibidas, arquivos web, configuração mobile/strict, manifest e lockfile sincronizados, centralização do AsyncStorage e catálogo demonstrativo real carregado isoladamente em memória. Ele não substitui compilação, testes de comportamento, Expo Doctor ou execução no Android.

O resultado Jest registra `success: true`, 164 testes aprovados e 10 suítes aprovadas. A instalação emitiu avisos de dependências e o exportador emitiu avisos de configuração de cores do terminal; nenhum causou falha. Os logs integrais foram preservados. O artefato Android final está em `android-bundle/` e no [ZIP do bundle Android](Garagem-PE-bundle-android.zip), de 3.146.456 bytes. Trata-se do bundle de distribuição Expo, não de um APK; seus [metadados](android-bundle/metadata.json) também foram preservados.

## Validação real no Expo Go Android

Ambiente observado pelo agente principal: **Expo Go 57.0.9**, emulador **Pixel 10a**, **Android 17 / API 37.1**. Testes realizados em 1080 × 2424 pixels com 420 dpi e em configuração de 360 dp (720 × 1280 pixels, 320 dpi), com fonte a 130%. O aplicativo foi aberto no Expo Go, operado pelos controles nativos e reaberto após encerramento forçado.

As evidências abaixo registram ações executadas no Android; quando uma regra também depende de testes automatizados, essa distinção está indicada. As capturas são relativas a esta pasta de entregáveis.

| Critério | Resultado observado | Evidência |
| --- | --- | --- |
| Abrir no Expo Go Android | Aprovado; telas nativas navegáveis e fluxos executados | [01 — mapa local](screenshots/01-mapa-local.png) |
| Busca, filtro e estado vazio | Casa Forte selecionado após negar GPS; busca Aurora encontrou a nova vaga, salva como favorita. Preço máximo R$ 5 com a busca Aurora produziu zero resultados; limpar recuperou o catálogo. Demais combinações de filtros cobertas pelos testes. | [10 — localização negada](screenshots/10-localizacao-negada.png), [15 — estado vazio](screenshots/15-filtro-estado-vazio.png) |
| Detalhes e privacidade | Localização aproximada exibida antes da confirmação; complemento e instruções liberados no comprovante | [02 — detalhes](screenshots/02-detalhes.png), [17 — comprovante com complemento](screenshots/17-reserva-complemento.png) |
| Formulário e confirmação | Datas/horários e veículo selecionados; pagamento simulado; códigos gerados e recibos exibidos | [11 — formulário](screenshots/11-confirmar-reserva-formulario.png), [03 — confirmação](screenshots/03-reserva-confirmada.png), [17 — nova reserva](screenshots/17-reserva-complemento.png) |
| Reserva nos dois modos | GPE-28UICE criada como motorista e recebida pelo proprietário; chegada, saída e avaliação registradas no mesmo fluxo | [17 — código/veículo](screenshots/17-reserva-complemento.png), [19 — avaliação do proprietário](screenshots/19-avaliacao-proprietario.png) |
| Cancelamento futuro | GPE-U2ZIOG cancelada no Android. Restrições de data/status/autorização também verificadas nos testes de domínio. | Execução observada pelo agente principal; [resultado dos testes](verification/jest-results.json) |
| Estadia e avaliações | GPE-GYBHA1 passou por check-in, check-out e avaliação de 5 estrelas com comentário. GPE-5NNKNN teve saída e avaliação do motorista pelo proprietário. GPE-28UICE recebeu avaliação de 5 estrelas pelo proprietário. | [04 — avaliação salva](screenshots/04-avaliacao-salva.png), [19 — avaliação do proprietário](screenshots/19-avaliacao-proprietario.png) |
| Cadastro, foto e edição | Vaga criada em quatro etapas com foto selecionada pelo Photo Picker; anúncio editado e salvo como “Garage Aurora Demo Editada”, Casa Forte, capacidade 2, R$ 10/h e R$ 50/diária | [06 — etapa 3](screenshots/06-cadastro-etapa-3.png), [07 — publicação](screenshots/07-vaga-publicada.png), [20 — anúncio editado](screenshots/20-foto-local-sem-original.png) |
| Pausa e reativação | Boa Viagem pausada após confirmação da ação e posteriormente reativada | Execução observada pelo agente principal; [20 — anúncio ativo após o teste](screenshots/20-foto-local-sem-original.png) |
| Ganhos e divisão 15%/85% | Após a reabertura final: 4 reservas concluídas, R$ 92,00 bruto, R$ 13,80 comissão e R$ 78,20 líquido. A reserva de R$ 20 exibe R$ 3 de comissão e R$ 17 líquidos. | [21 — ganhos finais após reabertura](screenshots/21-reabertura-final-ganhos.png), [19 — valores da reserva](screenshots/19-avaliacao-proprietario.png) |
| Persistência após encerramento forçado | Perfil/modo proprietário, vaga editada, foto, reservas e avaliações permaneceram após fechar e reabrir. “Na Demo” e veículo “Carro azul demo”, placa GPE9C99, foram salvos. | [09 — reabertura](screenshots/09-persistencia-apos-reabrir.png), [17 — perfil/veículo no recibo](screenshots/17-reserva-complemento.png), [20 — foto local](screenshots/20-foto-local-sem-original.png) |
| Reabertura após o npm ci final | Inicialização a frio da ExperienceActivity retornou `Status: ok`; interface do proprietário navegável, ganhos finais e foto preservados. Nenhum erro do aplicativo nos filtros de log examinados. | [21 — ganhos](screenshots/21-reabertura-final-ganhos.png), [22 — foto](screenshots/22-reabertura-final-foto.png), [runtime-final.json](verification/runtime-final.json) |
| Foto independente da seleção original | Foto continuou carregando após apagar somente a cópia de teste criada em `sdcard/Pictures` no emulador e também após o encerramento forçado/reabertura final. O arquivo original do usuário no Windows não foi removido. | [20 — foto sem o original do emulador](screenshots/20-foto-local-sem-original.png), [22 — foto após reabertura final](screenshots/22-reabertura-final-foto.png) |
| GPS negado e mapa indisponível | Negar localização permitiu escolher bairro manualmente. Falha de autorização do Google Maps no Expo Go acionou, após cerca de 12 s, mapa local com preços clicáveis; busca/lista/reserva permaneceram funcionais. | [10 — permissão negada](screenshots/10-localizacao-negada.png), [01 — mapa local](screenshots/01-mapa-local.png) |
| Fidelidade às cinco referências | Parecer visual aprovado nas áreas e configurações examinadas, com diferenças funcionais documentadas | [Revisão visual](REVISAO-VISUAL.md) |
| Fonte ampliada, margens e rolagem | Problemas identificados foram corrigidos e recapturados em 360 dp e fonte 130%; títulos, marcadores, valores e ações permaneceram legíveis nas áreas examinadas | [14 — mapa corrigido](screenshots/14-mapa-360-fonte-130-corrigido.png), [16 — resumo corrigido](screenshots/16-resumo-360-fonte-130-corrigido.png), [18 — painel](screenshots/18-painel-360-fonte-130.png) |

### Reservas usadas na verificação

| Reserva | Operação e valor observado |
| --- | --- |
| GPE-GYBHA1 | Boa Viagem, R$ 24,00 total = R$ 3,60 comissão + R$ 20,40 líquido; chegada, saída e avaliação de 5 estrelas com comentário. |
| GPE-U2ZIOG | Reserva demonstrativa futura cancelada pelo motorista. |
| GPE-5NNKNN | Reserva demonstrativa concluída e motorista avaliado pelo proprietário. |
| GPE-VCDP2L | Nova vaga Aurora, 2h × R$ 10,00 = R$ 20,00; conexão entre anúncio publicado e reserva do motorista. |
| GPE-28UICE | Nova reserva Aurora de R$ 20,00, placa GPE9C99, perfil Na Demo. Comprovante contém “Rua Ficticia Aurora, 100 · Vaga A - teste”; proprietário registrou chegada/saída e salvou nota 5. |

O nome “Garage Aurora Demo Editada” corresponde ao texto efetivamente salvo durante o teste, após autocorreção do teclado Android. A fotografia usada foi o PNG do mockup 2 selecionado na galeria; ele foi usado como foto de teste do anúncio, não como interface principal.

A avaliação do complemento encontrou uma falha real: a primeira reserva não incluía o complemento no snapshot de endereço. O domínio foi corrigido para novas reservas, sem reescrever registros anteriores. A GPE-28UICE e a captura 17 confirmam o comportamento corrigido. O DateTimePicker 9.1 foi ajustado para `onValueChange` e reexecutado sem o aviso identificado antes da correção.

Após concluir a GPE-28UICE e executar o npm ci final, o agente principal reabriu o aplicativo a frio. O Painel mostrou R$ 78,20; em Ganhos foram observadas 4 reservas concluídas, R$ 92,00 brutos, R$ 13,80 de comissão e R$ 78,20 líquidos, registrados na captura 21. A captura 08 preserva o estado anterior, de R$ 72,00 / R$ 10,80 / R$ 61,20, antes dessa última conclusão.

A captura 22 confirma a foto local, o anúncio editado, sua capacidade e valores depois da reabertura final, mesmo sem a imagem de seleção original no emulador. O registro [runtime-final.json](verification/runtime-final.json), observado às 20:29:40 UTC, contém `applicationErrors: []` para erros ReactNativeJS, AndroidRuntime, exceções fatais e JavaScript não tratado no novo processo Expo Go. Essa constatação é limitada aos filtros examinados; a falha de autorização do mapa Google permanece documentada separadamente. O Metro final carregou 915 módulos em 877 ms, sem avisos exibidos nessa execução de desenvolvimento; o export de produção contém 774 módulos.

## Critérios técnicos e de dados

- Valores em centavos; mínimo de uma hora; saída posterior; nenhuma tolerância para reserva passada; conflito por capacidade simultânea e disponibilidade semanal no fuso Recife.
- Vagas públicas não são aceitas; publicação exige declaração de responsabilidade e autorização. Pausa mantém histórico e impede novas reservas; alterações não podem invalidar reservas futuras já confirmadas.
- Catálogo inicial com oito bairros previstos, dois veículos e reservas de estados variados; perfis demonstrativos sem contatos pessoais reais.
- Schema local v2, gravação no primeiro uso, migração v1 preservada, primeiro backup de corrupção mantido e restauração explícita da demonstração.
- Dados históricos não devem ser alterados por edição de preço/endereço/instruções da vaga. Preferências anteriores de mapa/lista são preservadas.

## Limitações conhecidas do protótipo

- Não há contas reais, sincronização entre aparelhos, validação física da vaga ou pagamento/repasse verdadeiro.
- O Google Maps nativo apresentou falha de autorização no ambiente Expo Go utilizado. O componente permanece no projeto; mapa demonstrativo local e lista mantiveram preços, navegação e reserva funcionais. Não se declara o mapa base online aprovado nesse ambiente.
- Distâncias são aproximadas em linha reta; coordenadas, endereços e pessoas são demonstrativos. Não usar os endereços para deslocamento real.
- Reserva cujo período acabou sem check-in é mantida no histórico com aviso específico; não gera conclusão e avaliação automaticamente.
- A revisão visual aprovou as áreas e configurações examinadas nas capturas; esse parecer não afirma inspeção de todos os aparelhos Android existentes.

## Fechamento pelo agente principal

**Validação aprovada nas evidências registradas.** A reabertura final a frio no Expo Go após o último `npm ci` também foi aprovada, com interface navegável, dados financeiros e foto local preservados e sem erros do aplicativo nos filtros de log examinados. Não houve alteração das fontes entre os testes Android descritos e os comandos finais. A limitação do mapa base Google no ambiente Expo Go está documentada, com mapa local e lista funcionais. O Metro usado no teste foi encerrado normalmente, liberando a porta 8081; o usuário pode iniciar uma nova sessão com `npm start`.
