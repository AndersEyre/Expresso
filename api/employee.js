const express = require('express');
const employeeRouter = express.Router();
const sqlite3 = require('sqlite3');
const timesheetRouter = require('./timesheet');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeeRouter.use('/:employeeId/timesheets', timesheetRouter)

const validateEmployee = (req, res, next) => {
    const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage;
    if(!name || !position || !wage ){
        return res.status(400).send('Invalid Employee details');
    } else {
        next();
    };
}; 

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
const sql = `SELECT * FROM Employee WHERE Employee.id = $employeeId`;
const values = {$employeeId:employeeId};
db.get(sql, values, (err, employee) => {
    if(err){
        next(err);
    } else if (employee){
        req.employee = employee;
        next();
    } else {
        res.sendStatus(404);
    }
  });
});

employeeRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1',
    (err, rows) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({ employees: rows })
        }
    });
});

employeeRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    if(!name || !position || !wage || !isCurrentEmployee){
        return res.sendStatus(400)
    } else {

        const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
        VALUES ($name, $position, $wage, $is_current_employee)`;
        const values = {
            $name: name,
            $position: position,
            $wage: wage,
            $is_current_employee: isCurrentEmployee,
        };

        db.run(sql, values, function(err){
            if(err){
                next(err)
            } else {
                db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
                (err, employee) => {
                    res.status(201).send({employee:employee})
                });
            }
        });
    }
});

employeeRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({employee: req.employee});
});

employeeRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
    const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $is_current_employee
     WHERE Employee.id = $employeeId`;
    const values = {
        $name: name,
        $position: position,
        $wage: wage,
        $is_current_employee: isCurrentEmployee,
        $employeeId: req.params.employeeId
    };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
            (err, employee) => {
                if(err){
                    next(err);
                } else {
                    res.status(200).send({employee:employee})
                }
            });
        }
    });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
    const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
    const values = {$employeeId: req.params.employeeId};
  
    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
          (error, employee) => {
            res.status(200).send({employee: employee});
          });
      }
    });
  });






module.exports = employeeRouter;