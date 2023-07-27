<div align="center">
  
  ![image](https://github.com/ericky0/adonis-rpg/assets/53923000/3a6ae237-9a67-4b53-aeb0-eb74a201d0f3)
  
</div>

# adonis-rpg

##### en-us

## About the project

This project was developed using AdonisJS, and it is a complete API with authentication, authorization, and several complex business rules.
<br/><br/>
The API was built following the Test-Driven Development (TDD) methodology, which involves creating automated tests before implementing the functionalities.
<br/><br/>
This test-oriented approach ensures code quality and facilitates system maintenance and evolution, allowing new features to be added with more confidence.
<br/><br/>
This API was designed to be a system for users and game masters of RPG groups/tables, but it could also be used for various other scenarios. This particular scenario was chosen because it makes it easier to understand the proposed concept.

### A brief summary of the API routes

#### Users
- Create User: Validates the provided data and creates the user in the database.
- Update User: Updates the provided data if the user is authorized.

#### Passwords
- Forgot Password: Sends an email containing the necessary instructions to reset the password (includes a URL with a token).
- Reset Password: Searches for the user based on the token provided in the URL and allows updating the user's password.

#### Auth
- Login: Authenticates the user and creates a token that is valid for 2 hours.
- Logout: Ends the session and removes any token or identification associated with the user.

#### Tables
- Get Tables: Returns the tables; if there are no filters, this route will return all tables from the database. <br/>
There are also filters, such as the user specified in the query or the text contained in the table's title or description. <br/>
It's possible to use both filters. <br/>
To avoid "breaking" or freezing the application, this route returns the tables in a paginated way.
  
- Create Table: Validates the table information, creates the table, and automatically assigns the table's owner, who is the user logged in when creating it.
- Update Table: Replaces the old table information with the new one, but only if the updater is the table's owner.
- Remove Player From Table: Removes the player from the table. If you are the table's owner, you can remove any player except yourself. To leave the table, you need to delete the table entirely.
- Delete Table: Deletes the table. This action is only possible if the logged-in user is the table's owner.

#### Tables Requests
- Get Table Request: If you are the table's owner, you can see the list of user requests to join your table.
- Create Table Request: Creates a request to join the desired table.
- Accept Table Request: If you are authorized (the table's owner) and access this route, the specified user will be added to the "players" table of the respective table, and the request will be deleted from the database.
- Refuse Table Request: If you are authorized (the table's owner) and access this route, the request will be deleted from the database.



<br />
<br />
<br />
<br />
<br />

##### pt-br

## Sobre o projeto

Esse projeto foi desenvolvido utilizando AdonisJS, se trata de uma API completa com autenticação, autorização e várias regras de negócios complexas.
<br/><br/>
A API foi desenvolvida seguindo a metodologia TDD (Test-Driven Development), que envolve a criação de testes automatizados antes da implementação das funcionalidades. 
<br/><br/>
Essa abordagem orientada a testes garante a qualidade do código e facilita a manutenção e evolução do sistema, permitindo que novas funcionalidades sejam adicionadas com mais confiança.
<br/><br/>
Essa API foi feita com a ideia de ser um sistema para usuários e mestres de grupos/mesas de um jogo de RPG, mas também poderia ser usada para diversos outros cenários, esse cenário foi escolhido, porque fica mais fácil o entendimento do conceito proposto.

### Um rápido resumo sobre as rotas da API

#### Users
- Create User: Valida os dados informados e cria o usuário no banco.
- Update User: Atualiza os dados informados se o usuário for autorizado.

#### Passwords
- Forgot Password: Envia um e-mail contendo as instruções necessárias para redefinir a senha. (possui uma URL contendo um token)
- Reset Password: Procura o usuário pelo token que vem na URL e torna possível atualizar a senha do usuário.

#### Auth
- Login: Autentica o usuário e cria um token que é valido por 2 horas.
- Logout: Encerra a sessão e remove qualquer token ou identificação associado ao usuário.

#### Tables
- Get Tables: Retorna as mesas, caso não haja nenhum filtro, essa rota retornará todas as mesas do banco. <br/>
              Também há filtros como o usuário informado na query ou o texto que contém no título ou descrição da mesa.<br/> É possível informar ambos os filtros.<br />
              Visando não "quebrar, travar" a aplicação essa rota retorna as mesas de forma paginada. <br/>
  
- Create Table: Valida as informações da mesa, cria a mesa e insere automaticamente o dono da mesa, que é o usuário que está logado ao criá-la.
- Update Table: Substitui as antigas informações da mesa pelas novas, somente se quem estiver atualizando for o dono da mesa.
- Remove Player From Table: Remove o jogador da mesa, caso você seja o dono da mesa, será possível remover qualquer jogador exceto você mesmo. Para sair da mesa, será necessário deletar a mesa por completo.
- Delete Table: Deleta a mesa. Só é possível se o usuário logado for o dono da mesa.

#### Tables Requests
- Get Table Request: Se você for o dono da mesa, será possível ver a lista das requisições de usuários para entrar na sua mesa.
- Create Table Request: Cria uma requisição para participar na mesa que desejar.
- Accept Table Request: Se você for autorizado (dono da mesa) e acessar essa rota, o usuário informado será inserado na tabela "players" da mesa e a requisição será deletada do banco.
- Refuse Table Request: Se você for autorizado (dono da mesa) e acessar essa rota, a requisição será deletada do banco.
