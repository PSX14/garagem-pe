# Integração e correções — 05/11/2026

Base integrada: cinco commits de `hirla-andrade/garagem-pe`, até `1f30429`, preservando também os dois commits posteriores de `PSX14/garagem-pe`, até `4a084d1`. Histórico unido por merge, sem reescrever a autoria. As correções iniciadas localmente em 30/10 foram recuperadas e concluídas nesta integração.

## Mudanças

- Preservadas as correções de `Keyboard.dismiss()` e `signInWithPassword()` feitas pela Hirla em 30/10. Acrescentados rejeição de senha composta apenas por espaços, exigência de sessão válida e bloqueio de envios simultâneos.
- O login só chama a navegação após receber uma sessão válida do Supabase. Erros de credenciais e conexão mantêm o usuário no formulário.
- Preservado o cadastro conectado pela Hirla a `signUp`, com nome e telefone como metadados. Sem sessão imediata, apresenta orientação de confirmação por e-mail; não informa uma entrada que não ocorreu.
- Configuração ausente ou URL inválida não interrompem a inicialização. O modo demonstração continua disponível.
- Sessão persistida em namespace próprio pelo serviço central de armazenamento; acompanhamento de mudanças de sessão e renovação conforme o aplicativo fica ativo/inativo.
- Área “Conta de acesso” no Perfil, com entrada e saída da conta. Sair não apaga a demonstração local.
- Ajustadas dependências para Expo SDK 58.0.23, React 19.3 e React Native 0.88.1; corrigida a referência de rolagem para a nova tipagem nativa.
- Atualizados os testes para autenticação real simulada nos testes, configuração ausente, falhas de rede e sessão. Fontes nativas são simuladas apenas no Jest, que não possui o registro de assets Android.
- Removido o arquivo vazio de recuperação de senha. Essa função continua explicitamente indisponível no aplicativo.

## Configurar e executar

Na raiz do projeto, usando PowerShell:

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd start -- --clear
```

Antes de iniciar, preencha `.env` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use a chave pública do seu projeto, nunca secret/service_role. O `.env` está excluído do Git; o modelo contém somente exemplos. Abra pelo Expo Go Android compatível com SDK 58.

Na consulta de 30/10/2026, o projeto Supabase informado respondeu HTTP 200 na consulta de configurações: login por e-mail e cadastro habilitados, confirmação de e-mail obrigatória. A confirmação usa a configuração e os modelos de e-mail do próprio projeto Supabase. Não foram criadas contas, enviados e-mails de teste ou alteradas configurações remotas nesta correção.

## Roteiro manual

1. Abra “Já tenho uma conta · Entrar” na tela inicial ou “Entrar na conta” no Perfil.
2. Tente enviar os campos vazios; confira os avisos sem navegação.
3. Crie uma conta com seu e-mail, confira a mensagem e confirme o cadastro pelo e-mail recebido.
4. Entre com a conta confirmada e confira seu e-mail na área “Conta de acesso”.
5. Feche e reabra o aplicativo, confira a sessão e use “Sair da conta”.
6. Sem `.env`, reinicie o Expo e confira que a demonstração abre e o login informa a falta de configuração.

## Limites e validação

O Supabase autentica contas. Vagas, reservas, veículos, avaliações e ganhos continuam demonstrativos, locais e compartilhados neste aparelho; não foram migrados para tabelas remotas nem isolados por usuário. O login não é uma barreira de acesso a esses dados fictícios. Não há pagamentos reais.

A execução com conta real confirmada, a inspeção visual e a persistência após reinício desta versão no Android físico ainda devem ser conferidas pelo usuário no Expo Go. Em 05/11 o emulador chegou a aparecer no ADB, mas desconectou antes da instalação; o controle da interface foi interrompido e o usuário escolheu testar no celular. Não foi realizada uma nova validação visual Android.

As capturas e a auditoria visual de setembro documentam a versão anterior, não as novas telas de autenticação.

### Verificações automatizadas

Executadas em 05/11/2026 com Node 24.19.0 e npm 12.2.1:

| Comando | Resultado |
| --- | --- |
| npm ci | Aprovado; 1.283 pacotes instalados |
| npm run check | Aprovado; 272 verificações estruturais na rodada registrada |
| npm run typecheck | Aprovado |
| npm run lint | Aprovado; sem avisos de lint |
| npm test | 186 testes aprovados em 14 suítes |
| npm run check:dependencies | Dependências compatíveis |
| npm run doctor | 20/20 verificações aprovadas |
| npm run bundle:android | Bundle Hermes Android exportado; 868 módulos, 19 assets |
| npm run verify | Sequência integral com saída 0 |

No ambiente de execução foram usados temporários dentro do workspace para evitar a restrição de gravação encontrada anteriormente no compilador Hermes. A instalação usou UV_THREADPOOL_SIZE=1 para evitar as falhas intermitentes de criação de diretórios observadas no Windows. Nenhum teste foi desativado. Logs locais: work/install-nov05.log e work/verify-nov05-final.log.

Foi acrescentado um teste do CRUD completo de veículos com releitura da persistência após cadastro, edição e exclusão, além de testes de sucesso/erro de cadastro e rejeição de senha em branco. Os testes do Supabase simulam respostas e não comprovam login remoto real com uma conta confirmada.

Veja também o [roteiro das avaliações de 23/10, 30/10 e 06/11](METAS-AVALIACOES.md).
