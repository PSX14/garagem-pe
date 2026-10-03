# Garagem PE

**Estacione fácil. Ganhe com seu espaço.**

**APK Android:** o perfil `preview` foi preparado em `eas.json`. Siga o [guia para gerar e instalar o APK](outputs/GERAR-APK.md). A compilação EAS e a instalação do APK ainda não foram executadas; as evidências de execução existentes são do Expo Go. O APK demonstrativo usará diretamente o mapa local com preços clicáveis.

**PowerShell:** se aparecer bloqueio de `npm.ps1` ou `npx.ps1`, use `npm.cmd` e `npx.cmd` nos comandos deste guia, por exemplo `npm.cmd ci` e `npm.cmd start`.

Aplicativo acadêmico mobile para conectar motoristas a vagas privadas ociosas em Recife e na Região Metropolitana. O motorista pesquisa e reserva; o proprietário cadastra espaços, recebe reservas e acompanha ganhos simulados. Os dois modos usam o mesmo aplicativo e podem ser alternados na aba **Perfil**.

Toda a interface foi construída com **React Native, Expo e TypeScript strict**, usando componentes nativos e `StyleSheet`. Não há frontend web, HTML, CSS, React DOM, WebView, backend, autenticação real, banco remoto ou integração de pagamentos. O Metro executado durante o desenvolvimento serve o bundle do aplicativo; ele não é um backend do produto.

## Instalar e iniciar

Abra um terminal na raiz deste repositório, onde está o `package.json`.

Pré-requisitos:

- Node.js compatível com as dependências. O ambiente utilizado tem **Node 24.19.0** e **npm 11.17.0**; a linha Node 24 deve ser pelo menos 24.3.0.
- npm, com as versões exatas resolvidas no `package-lock.json`.
- Aparelho Android ou emulador Android e **Expo Go com suporte ao SDK 57**.
- Internet para instalar dependências e conexão entre computador e Android para carregar o bundle de desenvolvimento.

```sh
npm ci
npm start
```

No Android físico:

1. Abra o Expo Go compatível com SDK 57.
2. Mantenha computador e aparelho na mesma rede.
3. Use a leitura de QR Code do Expo Go para abrir o endereço mostrado pelo terminal.
4. Aguarde o carregamento e toque em **Encontrar uma vaga**, **Disponibilizar uma vaga** ou **Entrar no modo demonstração**.

Mantenha o terminal do Expo aberto enquanto usa a versão de desenvolvimento. Não é necessário cadastrar uma conta no Garagem PE ou configurar variáveis de ambiente, credenciais ou serviços externos.

### Emulador Android

Inicie um dispositivo virtual no Android Studio e depois execute:

```sh
npm run android
```

Esse comando inicia o Expo em modo Expo Go e solicita a abertura no dispositivo Android conectado. Também é possível executar `npm start` e pressionar `a` no terminal do Expo. Com vários dispositivos conectados, escolha o destino no ambiente Android antes de iniciar.

Se o aparelho não alcançar o computador, confira a rede e a liberação do processo Node/Metro no firewall. No emulador padrão do Android, `10.0.2.2` identifica o computador hospedeiro; um endereço `localhost` do emulador aponta para o próprio emulador. Em caso de cache antigo do bundle, use:

```sh
npm start -- --clear
```

Não limpe os dados do Expo Go para testar persistência: isso remove o armazenamento do ambiente de execução. Feche e reabra o projeto normalmente, mantendo o mesmo projeto e aparelho.

## Como experimentar os fluxos

### Motorista

1. Em **Explorar**, pesquise por nome, bairro, região ou referência, por exemplo `Boa Viagem`, `Zona Norte`, `Marco Zero` ou `UFPE`.
2. Escolha um bairro como origem das distâncias ou toque em **Usar localização atual**. Se negar a permissão ou o GPS estiver indisponível, a seleção manual e a busca continuam funcionando.
3. A primeira abertura usa o mapa; você pode alternar para lista e essa preferência fica salva. **Agora** procura um período livre a partir do momento atual; **Hoje** procura uma entrada possível ainda hoje em Recife, respeitando duração e disponibilidade. Toque novamente no chip selecionado para desmarcá-lo. Em **Filtros**, preço, distância, cobertura, portão, veículo, hora/diária, nota e ordenação também alteram lista e marcadores.
4. Abra a vaga e confira características, regras, dimensões, horários e localização aproximada. Toque em **Reservar vaga**.
5. Selecione entrada, saída, veículo salvo, cobrança por hora ou diária e uma forma de pagamento simulada. É possível cadastrar outro veículo nessa etapa.
6. Confirme para obter um código `GPE-XXXXXX`, o endereço fictício completo e as instruções de acesso. Abra a reserva ou volte ao início.
7. Em **Reservas**, consulte **Próximas**, **Em andamento**, **Concluídas** e **Canceladas**. Cancele uma reserva futura, registre o check-in quando disponível, encerre a estadia e avalie uma reserva concluída.

O coração salva favoritos. Busca, filtros e preferências são persistidos. A demonstração inclui reservas em diferentes estados para experimentar histórico e avaliações sem esperar o transcurso de uma estadia real.

### Proprietário

1. Em **Perfil**, selecione **Proprietário**.
2. No **Painel**, consulte ganhos líquidos concluídos, reservas do mês, ocupação simulada, próxima reserva, vagas ativas, histórico e repasses previstos.
3. Toque em **Cadastrar vaga** e percorra as quatro etapas: localização e apresentação, estrutura do espaço, fotos/preço/horários/regras e revisão final com acesso e responsabilidade. Os dados ficam no formulário ao avançar ou voltar; cada etapa valida seus campos.
4. Se desejar, selecione até cinco fotografias do aparelho. Confirme a declaração obrigatória de responsabilidade e autorização antes de publicar.
5. Em **Vagas**, abra o anúncio, edite informações e pause ou reative a disponibilidade. Alterações que contrariem reservas já confirmadas são validadas.
6. Em **Reservas**, consulte somente as reservas das suas vagas, registre chegada/saída e avalie motoristas depois da conclusão.
7. Em **Ganhos**, filtre por mês, situação e vaga. O gráfico de barras nativo e o histórico mostram bruto, comissão e líquido. Reservas canceladas ficam fora dos ganhos.

Para testar a conexão entre os dois modos, cadastre uma vaga como proprietário, alterne para motorista, reserve esse anúncio e volte ao proprietário para consultar a reserva recebida. Tudo ocorre no mesmo armazenamento local.

## Regras de reserva e valores

- Duração mínima de **1 hora**, saída posterior à entrada e entrada no futuro.
- Somente vagas privadas autorizadas e ativas podem receber novas reservas.
- O período deve respeitar os dias e horários cadastrados e a capacidade simultânea da vaga. O instante de saída libera a vaga para outra entrada no mesmo horário.
- Uma disponibilidade `00:00–24:00` representa o dia completo. Períodos que atravessam dias precisam respeitar a disponibilidade em cada dia.
- Datas, horários e meses dos relatórios seguem **Recife, UTC−03**, mesmo quando o aparelho usa outro fuso. A apresentação usa o padrão `pt-BR`.
- Por hora: preço horário multiplicado pela duração efetiva, arredondado ao centavo.
- Por diária: preço diário multiplicado por `ceil(horas / 24)`. Uma diária cobre até 24 horas; 25 horas usam duas diárias. A existência de diária não amplia os horários de funcionamento da vaga.
- O motorista pode cancelar somente enquanto a entrada estiver no futuro. O check-in abre 30 minutos antes da entrada e fecha ao terminar o período reservado. Uma estadia em andamento pode ser encerrada quando o veículo sair.
- Cada perfil pode avaliar uma reserva concluída com nota de 1 a 5, respeitando a relação entre motorista, reserva e proprietário.

Os valores são armazenados em **centavos inteiros**. A comissão de **15% está incluída no total anunciado**, e o proprietário recebe um repasse **simulado de 85%**. O líquido é calculado como total menos comissão, preservando os centavos após arredondamento.

Exemplo: 2 horas a R$ 12,00/h resultam em R$ 24,00 no total, R$ 3,60 de comissão e R$ 20,40 de líquido. Não se acrescentam R$ 3,60 ao total do motorista. Essa regra segue o requisito explícito de divisão 15%/85%, inclusive quando uma representação visual de referência sugere uma taxa adicional.

Pix, cartão e dinheiro são **rótulos de simulação**. O aplicativo não solicita cartão, CPF, conta bancária ou chave Pix e não cobra, transfere ou movimenta dinheiro.

## Dados locais, fotos e privacidade

O primeiro uso cria oito anúncios fictícios em Boa Viagem, Recife Antigo, Ilha do Leite, Derby, Madalena, Casa Forte, Graças e Várzea. Há perfis demonstrativos de motorista e proprietário, dois veículos, reservas em diferentes situações e uma vaga do proprietário local. Pessoas, placas, endereços e experiências são demonstrativos; não se deve dirigir aos pontos exibidos como se fossem vagas reais.

`src/state/persistence.ts` centraliza AsyncStorage. O estado versão 2 inclui perfis, modo, vagas, veículos, reservas, avaliações, favoritos, filtros e preferências. O provider serializa as alterações e confirma o sucesso depois de persistir. Os dados iniciais não são recriados a cada abertura.

Há validação do conteúdo lido, migração da versão inicial e recuperação de falhas. Dados corrompidos geram uma mensagem e têm uma cópia local preservada quando possível; a restauração requer ação explícita. A migração mantém anúncios antigos do proprietário pausados até confirmar a autorização que não existia no formato anterior.

Em **Perfil → Restaurar dados demonstrativos**, a confirmação substitui os dados atuais pelos dados fictícios iniciais. Reservas, anúncios, avaliações, veículos e preferências alterados deixam de fazer parte da demonstração restaurada.

As fotos selecionadas são copiadas da galeria para o diretório privado de documentos do aplicativo por `expo-file-system`. A galeria original não é alterada. As cópias são exibidas no anúncio local e não dependem de URLs. Sem foto, ou se uma foto não puder ser lida, o catálogo usa uma ilustração nativa. A permissão para fotos é opcional.

O catálogo, os marcadores e a tela pública da vaga usam o endereço aproximado. O endereço completo e as instruções ficam disponíveis no comprovante de uma reserva confirmada e na edição autorizada do proprietário. A reserva mantém uma cópia dos dados e preços confirmados, mesmo que o anúncio seja editado depois.

## Mapa, localização e uso offline

O mapa usa `react-native-maps` com marcadores de preço filtrados. Os pontos e as distâncias são aproximados; a distância é calculada em linha reta, não por rota viária. O mapa base pode precisar de internet e dos recursos de mapas do Android. Se os tiles não terminarem de carregar em 12 segundos, uma visão esquemática nativa mostra os mesmos preços e permite abrir as vagas usando somente dados locais. Ela é identificada como esquema, não representa ruas ou rotas e oferece **Tentar mapa online**. A lista permanece disponível e permite pesquisar, comparar e reservar sem depender do carregamento do mapa.

No ambiente de validação com Expo Go 57.0.9, o Google Maps registrou falha de autorização do próprio pacote `host.exp.exponent`. O mapa real permanece no projeto; a alternativa local trata essa falha sem exigir uma chave de API do usuário nem criar um serviço externo obrigatório.

`expo-location` pede permissão somente quando o usuário solicita a localização atual. Negação, GPS desligado ou demora têm mensagens e alternativa manual. Não há rastreamento contínuo nem localização em segundo plano.

As operações do produto funcionam com os dados locais após carregar o bundle. A primeira abertura do projeto em desenvolvimento depende do Metro acessível pelo Expo Go. A ação opcional de abrir a região no aplicativo de mapas depende de um aplicativo externo instalado; não é necessária para concluir uma reserva.

## Tecnologias e organização

O PDF `Garagem_PE_Formulario_e_Mockups.pdf` e os cinco arquivos `Garagem_PE_Mockup_1_Inicio.png`, `Garagem_PE_Mockup_2_Detalhes.png`, `Garagem_PE_Mockup_3_Reserva.png`, `Garagem_PE_Mockup_4_Cadastro.png` e `Garagem_PE_Mockup_5_Painel.png` são as referências fornecidas para a identidade e os fluxos. A implementação usa elementos nativos interativos: início azul-escuro, logotipo de marcador com P, mapa com preços, cartões claros, ilustração local de garagem, ações laranja, cadastro em etapas e painel financeiro. Os mockups não são usados como imagens de fundo para substituir telas funcionais.

As adaptações funcionais preservam a privacidade e a natureza acadêmica: não há selo de verificação de identidade ou propriedade, um preço ilustrado não substitui os dados do anúncio e a comissão segue a divisão explicitada na seção de valores. A comparação visual final e as evidências de execução Android são registradas separadamente.

Base: **Expo SDK 57**, **React Native 0.86.3**, **React 19.2.3** e **TypeScript 6 strict**, com `noUncheckedIndexedAccess`. As versões compatíveis dos módulos Expo e nativos estão no `package.json` e no lockfile.

Complementos: AsyncStorage, React Native Maps, Expo Location, Expo Image Picker, Expo FileSystem, DateTimePicker, Expo Vector Icons, Safe Area Context, Jest/Jest Expo e React Native Testing Library.

A navegação é uma pilha e abas **tipadas em TypeScript**, em `App.tsx`, com suporte ao botão Voltar do Android. Expo Router era uma preferência do pedido; a navegação local mantém o escopo funcional sem acrescentar outra dependência.

```text
App.tsx                         Entrada, SafeArea, abas e pilha de navegação
index.ts                        Registro do aplicativo Expo
app.json                        Configuração Expo, Android e permissões
src/
  domain/
    types.ts                    Contratos de estado e ações
    model.ts                    Transições e autorização
    seeds.ts                    Dados fictícios iniciais
    pricing.ts                  Preço, comissão, líquido e códigos
    availability.ts             Horários, conflitos e capacidade
    filters.ts                  Busca, distância, filtros e ordenação
    validation.ts               Validações tipadas
  state/
    AppProvider.tsx             Context e fila de alterações persistidas
    persistence.ts              AsyncStorage, versionamento e migração
  services/
    location.ts                 Localização opcional e bairros manuais
    photos.ts                   Seleção, cópia e limpeza de fotos locais
  screens/
    WelcomeScreen.tsx           Apresentação e entrada demonstrativa
    ProfileScreen.tsx           Perfis, modos, veículos e restauração
    driver/                     Explorar, mapa, detalhes e reservas
    owner/                      Painel, cadastro, vagas, reservas e ganhos
  ui/
    components.tsx              Componentes nativos reutilizáveis
    theme.ts                   Paleta e identidade visual
  **/*.test.ts(x)              Testes junto às áreas que verificam
outputs/                        Entregáveis, guia e bundle Android exportado
work/                           Arquivos intermediários de implementação/QA
AGENTS.md                       Regras permanentes do projeto
PLAN.md                         Etapas e decisões
PROGRESS.md                     Estado das verificações e pendências
```

## Verificar o projeto

Execute na raiz:

```sh
npm ci
npm run check
npm run typecheck
npm run lint
npm test -- --runInBand
npm run check:dependencies
npx expo-doctor
npm run bundle:android
```

| Comando | O que verifica ou gera |
| --- | --- |
| `npm ci` | Instalação reproduzível pelo lockfile |
| `npm run check` | Integridade estrutural, escopo exclusivamente nativo, configuração e catálogo demonstrativo |
| `npm run typecheck` | TypeScript strict sem emissão de arquivos |
| `npm run lint` | ESLint, sem avisos permitidos |
| `npm test -- --runInBand` | Testes em sequência |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run check:dependencies` | Compatibilidade das versões com Expo |
| `npm run doctor` ou `npx expo-doctor` | Diagnóstico Expo Doctor |
| `npm run bundle:android` | Exportação Android em `outputs/android-bundle` |
| `npm run verify` | Verificação estrutural, tipagem, lint, testes, compatibilidade, Doctor e bundle, nessa ordem |

`npm run verify` deve ser executado depois da instalação. O script de bundle equivale a:

```sh
npx expo export --platform android --output-dir outputs/android-bundle
```

A exportação produz JavaScript/Hermes, recursos e metadados Android; **não é um APK ou AAB instalável**. O modo de execução desta entrega é Expo Go Android.

Os testes cobrem preço/duração, comissão/líquido, conflitos, disponibilidade, datas passadas, filtros, códigos, cadastro e autorização, estados da reserva, avaliações, migração/persistência, fila do provider, fotos e componentes dos fluxos. A execução nativa, o reinício e a comparação com as referências visuais têm evidência própria; um bundle ou teste unitário aprovado não substitui essas verificações. Consulte `PROGRESS.md` e os registros produzidos em `outputs/` para os resultados da auditoria.

## Limitações e evolução

Este protótipo simula uma comunidade em **um único aparelho**. Não sincroniza dados entre usuários ou dispositivos, não confirma identidade ou propriedade, não possui mensageria, notificações remotas, suporte operacional, seguro, geocodificação de endereços ou navegação viária própria. A declaração de autorização é local, sem análise documental.

O armazenamento acadêmico não substitui proteção de dados e controle de acesso de um produto comercial. Use informações fictícias. Desinstalar ou limpar os dados do ambiente Expo Go pode remover cadastros e fotos locais. A orientação principal é retrato e o alvo de validação é Android; a presença de iOS no manifesto não representa uma validação em iPhone.

O painel financeiro e a ocupação são simulações calculadas a partir das reservas locais. Os ganhos concluídos e previstos são separados, os meses usam a entrada da reserva no fuso de Recife e não existe repasse financeiro real.

Uma versão comercial exigiria um escopo separado: pesquisa com usuários e acessibilidade em aparelhos reais, validação da autorização dos espaços, autenticação e permissões auditáveis, sincronização e concorrência entre dispositivos, proteção e ciclo de vida dos dados, moderação e suporte, observabilidade, testes de carga e distribuição assinada. Qualquer integração financeira demandaria definição de responsabilidades e um provedor apropriado; não faz parte deste repositório.
