const express = require('express');
const timesheetRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const employeeRouter = require('./employee');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
    const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId`;
    const values = {$timesheetId: timesheetId};
    db.get(sql, values, (err, timesheet) => {
        if(err){
            next(err);
        } else if (timesheet) {
            req.timesheet = timesheet;
            next();
        } else {
            res.sendStatus(404)
        }
    });
});

const validateTimesheet = (req, res, next) => {
    //const {hours, rate, date, employeeId} = req.body.timesheet;
    const hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employeeId = req.body.timesheet.employeeId;
    
    const sql = `SELECT * FROM Employee WHERE Employee.id = $employeeId`;
    const values = { $employeeId: employeeId};
    db.get(sql, values, (err, employee) => {
        if(err){
            next(err)
        } else if(!hours || !rate || !date || !employee || !employeeId){
            return res.status(400).send('Invalid Timesheet details');
        } else {
            next();
        };
    })
}

timesheetRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId`;
    const values = {$employeeId: req.params.employeeId};
    db.all(sql, values, (err, timesheets) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({timesheets: timesheets});
        }
    })

});


timesheetRouter.post('/', validateTimesheet, (req, res, next) => {
    const hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employeeId = req.body.timesheet.employeeId;
    const sql = `INSERT INTO Timesheet (hours, rate, date, employee_Id)
    VALUES ($hours, $rate, $date, $employeeId)`;
    const values = {
         $hours: hours,
         $rate: rate,       
         $date: date,
         $employeeId: employeeId
    };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = $lastid`;
            db.get(sql, (err, timesheet) => {
                res.status(201).send({timesheet: timesheet})
            });
        }
    });
            
});

timesheetRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
    const hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employeeId = req.body.timesheet.employeeId;
    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId
    WHERE Timesheet.id = $reqparams`;
    const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $reqparams: req.params.timesheetId
    };
    db.run(sql, values, function(err){
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`;
            db.get(sql, (err, timesheet) => {
                if(err){
                    next(err);
                } else {
                    res.status(200).send({ timesheet:timesheet })
                }
            });

        }
    });
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
    const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
    const timesheetValues = { $timesheetId: req.params.timesheetId};

    db.run(sql, timesheetValues, function(err){
        if(err){
            next(err)
        } else {
            res.sendStatus(204);
        }
    });
});


module.exports = timesheetRouter;