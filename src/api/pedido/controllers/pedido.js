// 'use strict';

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
//   async find(ctx) {
//     // Ajustar a consulta para popular os relacionamentos necessários, como cliente e itens/produtos
//     const { data, meta } = await super.find(ctx, {
//       populate: ['clientes', 'produtos']
//     });

//     // Função para calcular o valor total do pedido
//     const calcularValorTotal = pedido => {
//       if (!pedido.produtos || pedido.produtos.length === 0) {
//         return 0;
//       } else {
//         return pedido.produtos.reduce((acc, produto) => acc + produto.preco, 0);
//       }
//     };

//     // Função para mapear os pedidos para o formato desejado
//     const mapearPedido = pedido => ({
//       id: pedido.id,
//       codigoCliente: pedido.cod_cli,
//       itensPedido: pedido.produtos.map(produto => ({
//           id: produto.id,
//           nome: produto.nome, 
//           preco: produto.preco
//       })),
//       data: pedido.data_ped,
//       valor: calcularValorTotal(pedido)
//     });

//     // Mapear os dados para customizar a resposta
//     //const customizedPedidos = data.map(mapearPedido);

//     //return { data: customizedPedidos, meta };
//     return { data, mapearPedido };
//   }
// }));


'use strict';

/**
 * pedido controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
  // Função para criar um novo pedido
  async create(ctx) {
    const { data } = ctx.request.body;
    const { produtos, cliente, data_ped, status } = data;

    // Verificar se o cliente existe
    const clienteExiste = await strapi.entityService.findOne('api::cliente.cliente', cliente);
    if (!clienteExiste) {
      return ctx.badRequest('Cliente não existe.');
    }

    // Calcular o total do pedido
    let total = 0;
    for (const produtoId of produtos) {
      const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
      if (!produto) {
        return ctx.badRequest(`Produto com ID ${produtoId} não existe.`);
      }
      total += produto.Preco;
    }

    // Adicionar o total calculado aos dados do pedido
    data.valor = total;

    // Definir o status inicial, se não fornecido
    if (!status) {
      data.status = 'aguardando pagamento';
    }

    // Criar o pedido
    const response = await super.create(ctx);

    return response;
  },

  // Função para obter todos os registros de pedidos
  async find(ctx) {
    const entities = await strapi.entityService.findMany('api::pedido.pedido', {
      populate: ['produtos', 'cliente'],
    });

    // Sanitizar os dados para retornar apenas os campos desejados e incluir os nomes dos produtos e do cliente
    const sanitizedData = entities.map((entity) => {
      const produtosNomes = entity.produtos.map(produto => produto.Nome);
      const clienteNome = entity.cliente ? entity.cliente.Nome : 'Cliente não encontrado';

      return {
        id: entity.id,
        data_ped: entity.data_ped,
        valor: entity.valor,
        status: entity.status,
        produtos: produtosNomes,
        cliente: clienteNome,
      };
    });

    return { data: sanitizedData };
  },

  // Função para obter um registro específico de pedido
  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.entityService.findOne('api::pedido.pedido', id, {
      populate: ['produtos', 'cliente'],
    });

    if (!entity) {
      return ctx.notFound();
    }

    // Sanitizar a entidade para retornar apenas os campos desejados e incluir os nomes dos produtos e do cliente
    const produtosNomes = entity.produtos.map(produto => produto.Nome);
    const clienteNome = entity.cliente ? entity.cliente.Nome : 'Cliente não encontrado';

    const sanitizedEntity = {
      id: entity.id,
      data_ped: entity.data_ped,
      valor: entity.valor,
      status: entity.status,
      produtos: produtosNomes,
      cliente: clienteNome,
    };

    return this.transformResponse(sanitizedEntity);
  },
}));
