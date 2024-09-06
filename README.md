# 구조

```
    C:.
    │  .gitignore
    │  index.html
    │  jsconfig.json
    │  package-lock.json
    │  package.json
    │  README.md
    │  vite.config.js
    │
    ├─.vscode
    │      extensions.json
    │
    ├─public
    │      favicon.ico
    │
    └─src
        │  App.vue
        │  main.js
        │
        ├─assets
        │      base.css
        │      logo.svg
        │      main.css
        │
        ├─components
        │  │  HelloWorld.vue
        │  │  TheWelcome.vue
        │  │  WelcomeItem.vue
        │  │
        │  └─icons
        │          IconCommunity.vue
        │          IconDocumentation.vue
        │          IconEcosystem.vue
        │          IconSupport.vue
        │          IconTooling.vue
        │
        ├─(*)router                // 라우트 기능을 추가하면 자동 생성됨
        │      (*)index.js         // 필요한 만큼, URL 정의 => 컴포넌트 개수가 나옴
        │
        ├─(*)stores                // PINIA 기능 추가하면(상태관리) 자동 생성됨
        │      (*)counter.js       // 어떤 컴포넌트던 접근해서 상태를 공유, 엑세스, 수정할수았는 스토어 제공, 커스터마이즈 가능함
        │
        └─views
                AboutView.vue
                HomeView.vue
```

# MyChart.vue
    - chart.js 스프링부트에서  JS레벨로 연동
    - vue + chart.js => SPA 개념으로 처리
    - 설치 => 패키지 확인 (npmjs.com)
    ```
        $ npm install --save vue-chartjs chart.js
    ```

    - 설치 => 통신 패키지 : axios
    ```
        $ npm install --save axios
    ```