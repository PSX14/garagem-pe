# Revisão visual do Garagem PE

Inspeção de capturas reais do Android em 9 de setembro de 2026, comparadas aos cinco PNGs fornecidos em `Garagem Pe`. O parecer avalia as áreas efetivamente visíveis nas capturas: composição, contraste, legibilidade, espaçamento, rolagem e correspondência com a etapa do fluxo. O relatório de validação separado registra execução, ações e persistência.

## Comparação com as referências

| Referência fornecida | Evidência Android examinada | Resultado visual |
| --- | --- | --- |
| `Garagem_PE_Mockup_1_Inicio.png` | `work/android/home-refined.png`, `screenshots/01-mapa-local.png`, `screenshots/10-localizacao-negada.png` | Fundo azul-escuro, logotipo com marcador P laranja, busca branca, chips Agora/Hoje/Filtros, mapa em destaque e cartões horizontais claros preservam a hierarquia. Alternância de mapa/lista e origem manual ficam identificáveis. |
| `Garagem_PE_Mockup_2_Detalhes.png` | `work/android/detail-refined.png` | Ilustração ampla de garagem, cartão branco sobreposto, informações aproximadas, nota, comodidades em duas colunas e CTA laranja. Textos e preço dentro das margens; o restante das informações continua por rolagem. |
| `Garagem_PE_Mockup_3_Reserva.png` | `screenshots/11-confirmar-reserva-formulario.png`, `work/android/small-booking-form.png`, `work/android/small-booking-cta.png` | Cabeçalho “Confirmar reserva”, título “Revise os detalhes”, resumo da vaga com miniatura, cartões de data/horário, pagamento e valores e CTA final. Datas nativas editáveis e seleção de veículo tornam o formulário mais longo. Na fonte de 130%, as datas quebram em duas linhas, mantendo controles e horários legíveis. |
| `Garagem_PE_Mockup_4_Cadastro.png` | `screenshots/06-cadastro-etapa-3.png`, `screenshots/07-vaga-publicada.png` | Etapa 3 de 4, progresso laranja, seleção de até cinco fotos, miniatura e remoção, campos do anúncio e confirmação de publicação. A foto selecionada acrescenta altura e o formulário continua por rolagem. |
| `Garagem_PE_Mockup_5_Painel.png` | `screenshots/05-painel-proprietario.png`, `screenshots/08-ganhos.png` | Cabeçalho azul-escuro, cartão branco de ganhos sobreposto, indicadores, gráfico semanal e próxima reserva. Na tela de ganhos, filtros e bruto/comissão/líquido usam dados locais e permanecem legíveis. |

Capturas complementares examinadas: `screenshots/03-reserva-confirmada.png`, `screenshots/04-avaliacao-salva.png` e `screenshots/09-persistencia-apos-reabrir.png`. O comprovante, a avaliação salva e os anúncios reabertos têm hierarquia clara e botões identificáveis nas áreas visíveis. A captura 03 mostra a etapa posterior à confirmação; a comparação do formulário com o mockup 3 usa a captura 11.

## Diferenças funcionais documentadas

- As telas são compostas por elementos nativos interativos, com conteúdo variável. Informações adicionais exigidas pelo pedido, fonte ampliada e fotos selecionadas aumentam a rolagem.
- A identificação verde “Espaço privado autorizado” representa a declaração local exigida no cadastro. O aplicativo não oferece autenticação real, verificação de identidade ou análise documental de propriedade.
- Confirmações e formas de pagamento indicam a simulação. O preço anunciado inclui 15% de comissão, com repasse de 85%. Por exemplo, R$ 24,00 geram R$ 3,60 de comissão e R$ 20,40 líquidos. Essa regra segue o texto do pedido, que prevalece sobre a soma adicional ilustrada no mockup.
- A captura do mapa local apresenta um esquema identificado como aproximado, com preços que abrem as vagas. Ele aparece quando o mapa online não carrega; não representa ruas ou rotas. O motivo encontrado no ambiente Expo Go e o comportamento de contingência constam no guia.
- As capturas 06, 07 e 09 incluem uma imagem do mockup escolhida pelo operador na galeria durante o teste de cópia e persistência de fotos. Ela está dentro da área de foto de um anúncio criado pelo usuário, com campos, botões e navegação nativos ao redor.
- O círculo cinza com engrenagem no canto superior direito pertence ao ambiente Expo Go. Ele aparece por cima de parte do conteúdo nas capturas e não é um componente implementado pelo Garagem PE.

## Ajustes encontrados durante a inspeção

1. O verde original `#22A06B` tinha contraste de aproximadamente 3,02:1 sobre `#E9F7F0` nos textos pequenos. Foi criado `successText: #147A50`, com aproximadamente 4,84:1 nesse fundo; os ícones preservam o verde de confirmação original.
2. Uma avaliação agregada aparecia como `4,903`. Cartões, detalhes e formulário agora exibem uma casa decimal em `pt-BR` (`4,9`), mantendo a precisão do cálculo. Há teste de regressão.
3. Em 360 dp e fonte de 130%, o título “Explore as vagas” e os controles Mapa/Lista excediam a margem. A linha agora permite que a alternância passe à linha seguinte.
4. No mesmo tamanho, `R$ 10,00` quebrava dentro do marcador do mapa local. A largura e a altura do marcador agora acompanham o tamanho da fonte e do preço; os limites e o espaçamento usam essas dimensões.
5. O rótulo “Comissão incluída (15%)” empurrava o valor para fora da margem interna. Os rótulos financeiros do formulário, comprovante e detalhe agora podem quebrar de linha, preservando a largura dos valores.

Após os ajustes, tipagem, lint dos módulos motorista e os 17 testes de componentes motorista passaram. A recaptura `screenshots/14-mapa-360-fonte-130-corrigido.png` confirma o título e a alternância em linhas separadas dentro da margem, preço completo em uma linha no marcador e legenda do esquema legível. A recaptura `screenshots/16-resumo-360-fonte-130-corrigido.png` confirma o rótulo da comissão em duas linhas, valores completos em uma linha e margens internas preservadas. O estado vazio em `screenshots/15-filtro-estado-vazio.png` também mantém orientação e ação de limpeza completas no tamanho ampliado.

## Parecer final

**Revisão visual aprovada nas áreas e configurações examinadas.** As cinco telas principais apresentam correspondência de identidade e hierarquia com os cinco mockups fornecidos, com as adaptações funcionais descritas acima. Os problemas concretos de contraste, precisão exibida e layout ampliado encontrados nesta inspeção foram corrigidos; os dois ajustes de layout de 360 dp e fonte de 130% foram conferidos novamente em capturas reais do Android. Não restou defeito visual identificado nessas evidências.

Esta aprovação corresponde à inspeção visual delimitada neste documento. A consolidação dos comandos, fluxos executados, reinício e persistência pertence a `RELATORIO-VALIDACAO.md`.
