# splendor_angular

Temat aplikacji: Splendor w wersji Web App. Szczególna uwaga położona na stworzenie wygodnego interfejsu dla smartfonów w orientacji pionowej

Opis: Turowa gra planszowa/karciana. Aby nowy użytkownik mógł zagrać musi się zarejestrować a następnie zalogować. Po zalogowaniu ma możliwość wyzwania do trzech aktualnie zalogowanych graczy. Wyzwanemu graczowi pokazuje się dialog umożliwiający podjęcie wyzwania. Po zaakceptowaniu lub odrzuceniu wyzwania wszyscy gracze którzy zaakceptowali zostają przeniesieni do rozgrywki. Celem gry jest zdobycie jak największej liczby punktów, gracz w swojej turze może dobrać zasoby lub za te zasoby kupić karty. wszystkie karty produkują co turę 1 zasób, część z nich warta jest też punkty.

Aplikacja REST, frontend wykonany w Angularze z wykorzystaniem , autentykacja przez BASIC AUTH, postawiony na github pages(https://ponurson.github.io/splendor_angular_frontend/). Backend - Spring Boot ze Spring Security postawiony na Heroku, baza Heroku Postgres

Uwagi: wylogowanie się lub przejście/cofnięcie do home powoduje usunięcie z rozgrywki/usuniećie gry jeżeli jest się ostatnim graczem, odświerzanie nie powinno powodować usunięcia z gry.

Podstawa frontendu zaczerpnięta z: https://jasonwatmore.com/post/2020/04/28/angular-9-user-registration-and-login-example-tutorial
