import express from 'express';

import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

const customers = [];

function veriftIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: 'Customer not found!' })
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + opration.amount;
        } else {
            return acc - opration.amount;
        }
    }, 0);

    return balance;
}

app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!"})
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

app.get('/statement', veriftIfExistsAccountCPF, (request, response) => {
    
    const { customer } = request;

    return response.json(customer.statement)
});

app.post('/deposit', veriftIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: 'credit'
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post('/withdraw', veriftIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;

    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: 'Insufficiente funds!' });
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: 'debit'
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get('/statement/date', veriftIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + ' 00:00')

    const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat)).toDateString();

    return response.json(customer.statement)
});

app.put('/account', veriftIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send()
});

app.get('/account', veriftIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer)
});

app.delete('/account', veriftIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1)

    return response.status(200).json(customers);
});

app.get('/balance', veriftIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance)
});

app.listen(3333);