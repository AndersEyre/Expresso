const express = require('express');
const menuItemRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const menuRouter = require('./menu');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId`;
    const values = {$menuItemId: menuItemId};
    db.get(sql, values, (err, menuItem) => {
        if(err){
            next(err);
        } else if (menuItem) {
            req.menuItem = menuItem;
            next();
        } else {
            res.sendStatus(404)
        }
    });
});

const validateMenuItem = (req, res, next) => {
    const name = req.body.menuItem.name,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId;
    const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
    const values = {$menuId: menuId};
    db.get(sql, values, (err, menu) => {
        if(err){
            next(err);
        } else if(!name || !inventory || !price || !menu){
            return res.status(400).send(req.body.menuItem);
        } else {
            next();
        };
    });
};

menuItemRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`;
    const values = {$menuId: req.params.menuId};
    db.all(sql, values, (err, menuItems) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({menuItems: menuItems});
        }
    })

});

menuItemRouter.post('/', validateMenuItem, (req, res, next) => {
    const name = req.body.menuItem.name,
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId;
    const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
    VALUES ($name, $description, $inventory, $price, $menuId )`;
    const values = {
         $name: name,
         $description: description,
         $inventory: inventory,
         $price: price,
         $menuId: menuId
    };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`;
            db.get(sql, (err, menuItem) => {
                res.status(201).send({menuItem: menuItem})
            });
        }
    });
});

menuItemRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
    const name = req.body.menuItem.name,
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuItemId = req.params.menuItemId;
    const sql = `UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price
    WHERE MenuItem.id = $menuItemId`;
    const values = {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuItemId: menuItemId
   };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`;
            db.get(sql, (err, menuItem) => {
                if(err){
                    next(err);
                } else {
                    res.status(200).send({ menuItem:menuItem })
                }
            });

        }
    });
});


menuItemRouter.delete('/:menuItemId', (req, res, next) => {
    const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
    const menuItemValues = { $menuItemId: req.params.menuItemId};

    db.run(sql, menuItemValues, function(err){
        if(err){
            next(err)
        } else {
            res.sendStatus(204);
        }
    });
});


module.exports = menuItemRouter;