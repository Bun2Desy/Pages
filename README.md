# Pages
## CSRF 
Подделка межсайтовых запросов (также известная как CSRF) — это уязвимость веб-безопасности, которая позволяет злоумышленнику побуждать пользователей выполнять действия, которые они не собираются выполнять. Она позволяет злоумышленнику частично обойти политику одного и того же источника, которая разработана для предотвращения вмешательства различных веб-сайтов друг в друга.

### Какие признаки говорят о присутствии CSRF
* **Соответствующее действие**. В приложении есть действие, которое злоумышленник имеет причину вызвать. Это может быть привилегированное действие (например, изменение разрешений для других пользователей) или любое действие с данными, специфичными для пользователя (например, изменение собственного пароля пользователя).
* **Обработка сеансов на основе cookie-файлов**. Выполнение действия подразумевает отправку одного или нескольких HTTP-запросов, и приложение полагается исключительно на cookie-файлы сеансов для идентификации пользователя, сделавшего запросы. Других механизмов для отслеживания сеансов или проверки пользовательских запросов не предусмотрено.
* **Никаких непредсказуемых параметров запроса**. Запросы, которые выполняют действие, не содержат никаких параметров, значения которых злоумышленник не может определить или угадать. Например, когда пользователь хочет сменить пароль, функция не уязвима, если злоумышленнику нужно знать значение существующего пароля.

## Способы защиты от CSRF
* CSRF-токен — это уникальное, секретное и непредсказуемое значение, которое генерируется серверным приложением и передается клиенту. При попытке выполнить конфиденциальное действие, например, отправку формы, клиент должен включить в запрос правильный CSRF-токен. Это значительно затрудняет для злоумышленника создание допустимого запроса от имени жертвы.

* Файлы cookie SameSite - SameSite - это механизм безопасности браузера, который определяет, когда файлы cookie веб-сайта включаются в запросы, исходящие с других веб-сайтов. Поскольку запросы на выполнение конфиденциальных действий обычно требуют аутентифицированного сеансового файла cookie, соответствующие ограничения SameSite могут помешать злоумышленнику инициировать эти действия на другом сайте.

* Проверка на основе реферера - Некоторые приложения используют заголовок HTTP Referer, чтобы попытаться защититься от атак CSRF, обычно проверяя, что запрос исходит из собственного домена приложения. Это, как правило, менее эффективно, чем проверка токена CSRF.

## Запуск
Чтобы запустить приложение надо из корня репозитория активировать команду `docker compose up -d`
Также надо добавить следующие записи в файл hosts:
```
127.0.0.1   cab.local
127.0.0.1   posts.local
```

## Описание приложения
В данном приложении существует два сайта `cab.local` и `posts.local`, на `posts.local` можно создавать страницы html, а на `cab.local` общаться с ботом и просить, чтобы он посмотрел страницу. При вводе названия страницы он будет переходить на нее и смотреть, что на ней есть.
Также в аккаунте есть возможность смены пароля. В данном приложении присутствует уязвимость CSRF для смены пароля, так как:
1) При изменение пароля требуется только новое значение пароля, старый пароль знать не нужно
2) При отправке запроса проверяются только куки файлы, то есть никаких CSRF токенов не используется

## Writeup
1. Видим что на сайте `cab.local` на аккаунтах есть поле "Here not flag". Отсюда возникает предположение, что надо попробовать получить доступ к аккаунту админа. 
2. Посмотрим как выполняется запрос на изменение пароля. Видим, что никаких дополнительных параметров не передается кроме кук и самого пароля. В свойствах куки видим, что они с параметром SameSite=Lax. 
3. Попробуем перейти на второй сайт `posts.local` и на нем реализовать страницу с автоматической отправкой формы на смену пароля. Изначально форма отправки пароля отправялется методом POST.
```
<form action="http://cab.local/api/change-password" method="POST">
<input name="password" value="12345">
</form>
<script>document.forms[0].submit();</script>
```
Но если мы попробуем реализовать точно такую же форму, то не сможем поменять пароль, так как параметр SameSite=Lax говорит о том, что куки при кроссдоменных запросах передаются только при методе GET.

4. Тогда попробуем реализовать форму отправки методом GET. 
```
<form action="http://cab.local/api/change-password" method="GET">
<input name="password" value="12345">
</form>
<script>document.forms[0].submit();</script>
```
5. И если загрузим данную страницу и перейдем по ней, то увидим, что мы сами себе поменяли пароль. Тогда пишем боту название данной страницы, и проверяем, поменяется ли пароль. Пробуем зайти под админом с нашим паролем и о чудо: мы попали в аккаунт админа. 
6. А там самое интересное, мы видим флаг) 
`practice{Wh@t3Ver_D0E5N7_k!LL_you_m@KES_Y0u_5troN6eR}`