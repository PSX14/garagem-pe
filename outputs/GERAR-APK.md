# Gerar o APK do Garagem PE

O perfil `preview` em `eas.json` gera um APK de instalação direta, com o aplicativo e seus recursos incluídos. Depois de instalado, ele funciona sem Expo Go ou Metro. O EAS Build é o serviço de compilação do Expo; não acrescenta backend, contas reais ou pagamentos ao aplicativo.

## No PowerShell

Execute na pasta do projeto, um comando por vez. Use `npm.cmd` e `npx.cmd` para evitar o bloqueio de scripts `.ps1` encontrado neste Windows.

```powershell
cd "C:\Users\Gabs\Documents\Codex\2026-09-04\goal-entregar-no-reposit-rio-atual"
npm.cmd ci
npx.cmd eas-cli@latest login
```

Entre com sua conta Expo no próprio terminal. Se ainda não tem conta, crie uma em [expo.dev/signup](https://expo.dev/signup). O EAS Build aceita contas do plano gratuito, sujeito aos limites e à fila do serviço.

Este diretório foi entregue sem histórico Git. Na mesma janela do PowerShell, habilite o modo sem Git e inicie a compilação:

```powershell
$env:EAS_NO_VCS = "1"
$env:EAS_PROJECT_ROOT = (Get-Location).Path
npx.cmd eas-cli@latest build --platform android --profile preview
```

Na primeira execução:

1. Se o CLI pedir autorização para instalar `eas-cli`, responda `y`.
2. Confirme a criação/vinculação do projeto Garagem PE na sua conta Expo. O CLI registra o identificador do projeto na configuração local.
3. Se perguntar sobre gerar uma nova chave Android, escolha `Generate new keystore`/`Yes`. Essa chave assina o APK e fica gerenciada pelo EAS.
4. Aguarde o resultado no terminal ou acompanhe o link da compilação. Quando terminar com sucesso, abra o link de download do APK no Android.
5. Instale o arquivo e, se o Android solicitar, permita a instalação por esse navegador ou gerenciador de arquivos. Abra o ícone **Garagem PE**.

O EAS envia os fontes necessários ao serviço para compilar. `.easignore` exclui caches, temporários, capturas, relatórios, bundles anteriores e arquivos locais de assinatura do envio. Não há publicação na Play Store neste procedimento.

## Particularidades desta versão

- O perfil APK define `EXPO_PUBLIC_MAP_MODE=local`. Ele abre diretamente o mapa esquemático nativo, com preços clicáveis e os mesmos filtros/lista. Não monta o Google Maps sem uma chave Android própria. O esquema é aproximado, sem ruas ou rotas.
- O modo Expo Go continua com o mapa nativo e a alternativa local quando ele não carrega.
- O APK tem armazenamento próprio. As alterações feitas dentro do Expo Go não são transferidas automaticamente; a primeira instalação começa com os dados fictícios iniciais.
- Fotos, reservas e alterações passam a persistir no APK. Teste fechar e reabrir o aplicativo; não limpe seus dados durante a verificação.
- Atualizações do APK devem manter o pacote `br.com.garagempe.app` e a mesma chave de assinatura. Ao gerar versões futuras, reutilize as credenciais do projeto.
- O ZIP `Garagem-PE-bundle-android.zip` contém o bundle Expo exportado anteriormente. O arquivo instalável `.apk` será fornecido pela compilação EAS.

## Estado desta preparação

Perfil e instruções preparados localmente. A proteção de mapa local passou nos quatro testes do componente, no TypeScript strict e no lint; a verificação estrutural aprovou 239 itens. O bundle Android com `EXPO_PUBLIC_MAP_MODE=local` foi exportado com sucesso (774 módulos, 19 assets) em `work/apk-preview-bundle`.

A compilação remota e a instalação do APK ainda precisam ser executadas com a conta Expo do usuário; não se declara um APK gerado ou testado.

Referências oficiais: [APK no EAS Build](https://docs.expo.dev/build-reference/apk/), [primeira compilação e assinatura Android](https://docs.expo.dev/build/setup/), [exclusão de arquivos do envio](https://docs.expo.dev/build-reference/easignore/).
