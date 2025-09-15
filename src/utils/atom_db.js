const sql = require('mssql')
const sqlConfig = require('../sql_db')

async function getTokenByEcommerce(id)
{
    try
    {
        await sql.connect(sqlConfig)
        const result = await sql.query(`select [AmbarDeliquadros].[dbo].[ECOM_METODOS].TOKEN_TEMP AS TOKEN, [AmbarDeliquadros].[dbo].[ECOM_ORIGEM].ORIGEM_NOME, [AmbarDeliquadros].[dbo].[ECOM_ORIGEM].ORIGEM_ID FROM [AmbarDeliquadros].[dbo].ECOM_METODOS
        join [AmbarDeliquadros].[dbo].[ECOM_ORIGEM] on [AmbarDeliquadros].[dbo].[ECOM_METODOS].ORIGEM = [AmbarDeliquadros].[dbo].[ECOM_ORIGEM].ORIGEM_ID
        where [AmbarDeliquadros].[dbo].[ECOM_METODOS].ECOM_ID = '2' and [AmbarDeliquadros].[dbo].[ECOM_METODOS].ORIGEM = '${id}';`);

        return result.recordsets[0];
    } catch (err) {
        console.log("Error on getTokenByEcommerce(id)")
        throw(err)
    }
}

async function getItems() {
    try
    {
        await sql.connect(sqlConfig)
        const result = await sql.query(
            `
            select 
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].AUTOID,
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].PEDIDO,
            TRIM([AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].COD_INTERNO) AS COD_INTERNO,
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].APROVACAO AS STATUS_ID,
            TRIM([AmbarDeliquadros].[dbo].[STATUS_APROVACOES_BASE].DESCRICAO) AS STATAUS_DESC,
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].ORIGEM,
            TRIM([AmbarDeliquadros].[dbo].[ECOM_ORIGEM].ORIGEM_NOME) AS ECOMMERCE
            from 
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE] join [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE] on
            [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].PEDIDO = [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].PEDIDO
            join [AmbarDeliquadros].[dbo].[EMPRESA] on [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].EMPRESA = [AmbarDeliquadros].[dbo].[EMPRESA].DIAG_EMPRESA
            join  [AmbarDeliquadros].[dbo].[ECOM_ORIGEM] on [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].ORIGEM = [AmbarDeliquadros].[dbo].[ECOM_ORIGEM].ORIGEM_ID
            join [AmbarDeliquadros].[dbo].[STATUS_APROVACOES_BASE] on [AmbarDeliquadros].[dbo].[STATUS_APROVACOES_BASE].STATUS_ID = [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].APROVACAO
            WHERE 
            (
                [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_ITENS_CLIENTE].COD_INTERNO like('TD%')
            ) 
            and [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].POSICAO_ETQ <> '1'
            and [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].POSICAO <> 'CANCELADO      '
            and [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].APROVACAO <> 29
            and [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].TIPO_FRETE <> 'fulfillment'
            and [AmbarDeliquadros].[dbo].[PEDIDO_MATERIAIS_CLIENTE].DTCANCELAMENTO is null;
            `
        );

        return result.recordsets[0];
    } catch (err) {
        console.log("Error on getItems()")
        throw(err)
    }
}

module.exports = { getTokenByEcommerce, getItems };