'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
  async find(ctx) {
    // Ajustar a consulta para popular os relacionamentos necessários, como cliente e itens/produtos
    const { data, meta } = await super.find(ctx, {
      populate: ['clientes', 'produtos']
    });

    // Função para calcular o valor total do pedido
    const calcularValorTotal = pedido => {
      if (!pedido.produtos || pedido.produtos.length === 0) {
        return 0;
      } else {
        return pedido.produtos.reduce((acc, produto) => acc + produto.preco, 0);
      }
    };

    // Função para mapear os pedidos para o formato desejado
    const mapearPedido = pedido => ({
      id: pedido.id,
      codigoCliente: pedido.cod_cli,
      itensPedido: pedido.produtos.map(produto => ({
          id: produto.id,
          nome: produto.nome, 
          preco: produto.preco
      })),
      data: pedido.data_ped,
      valor: calcularValorTotal(pedido)
    });

    // Mapear os dados para customizar a resposta
    //const customizedPedidos = data.map(mapearPedido);

    //return { data: customizedPedidos, meta };
    return { data, mapearPedido };
  }
}));