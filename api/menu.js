const express = require('express');
const menuRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuItemRouter = require('./menuItem')

menuRouter.use('/:menuId/menu-items', menuItemRouter);


const validateMenu = (req, res, next) => {
    const title = req.body.menu.title;
    if(!title ){
        return res.status(400).send('Menu Title Required');
    } else {
        next();
    };
}; 

const checkIfEmptyMenu = (req, res, next) => {
    const sql = `SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`;
    db.get(sql, (err, menuItem) => {
        if(err){
            next(err)
        } else if (!menuItem){
            next();
        } else {
            res.status(400).send('Cannot Delete Menu with Menu Items')
        }
    });
}

menuRouter.param('menuId', (req, res, next, menuId) => {
    const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
    const values = {$menuId:menuId};
    db.get(sql, values, (err, menu) => {
        if(err){
            next(err);
        } else if (menu){
            req.menu = menu;
            next();
        } else {
            res.sendStatus(404);
        }
      });
    });

menuRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Menu',
    (err, rows) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({menus:rows })
        }
    });
});

menuRouter.post('/', (req, res, next) => {
    const title = req.body.menu.title;
    if(!title){
        return res.sendStatus(400)
    } else {

        const sql = `INSERT INTO Menu (title)
        VALUES ($title)`;
        const values = {
            $title: title
        };

        db.run(sql, values, function(err){
            if(err){
                next(err)
            } else {
                db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
                (err, menu) => {
                    res.status(201).send({menu:menu})
                });
            }
        });
    }
});


menuRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({menu: req.menu});
});

menuRouter.put('/:menuId', validateMenu, (req, res, next) => {
    const title = req.body.menu.title;
    const sql = `UPDATE Menu SET title = $title
     WHERE Menu.id = $menuId`;
    const values = {
        $title: title,
        $menuId: req.params.menuId
    };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
            (err, menu) => {
                if(err){
                    next(err);
                } else {
                    res.status(200).send({menu:menu});
                }
            });
        }
    });
});

menuRouter.delete('/:menuId', checkIfEmptyMenu, (req, res, next) => {
    const sql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
    const values = {$menuId: req.params.menuId};
  
    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
          (error, menu) => {
              if(!menu){
                  res.sendStatus(204)
              } else {
                  res.status(400).send('Menu could not be removed')
              }
            
          });
      }
    });
  });


module.exports = menuRouter;