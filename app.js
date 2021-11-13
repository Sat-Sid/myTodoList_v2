//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//connecting to mongodb using mongoose
mongoose.connect("mongodb://localhost:27017/mytodoDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//Item Schema
const mytodoItemSchema = {
  name: String
};
//Item Model or Collection
const Item = mongoose.model("Item", mytodoItemSchema);

const item1 = new Item({
  name: "Default Item 1"
});

const item2 = new Item({
  name: "Default Item 2"
});

const item3 = new Item({
  name: "Default Item 3"
});

const defaultItems = [item1, item2, item3];
//List Schema
const mytodolistsSchema = {
  name: String,
  items: [mytodoItemSchema]
};
//List Model
const List = mongoose.model("List", mytodolistsSchema);

//Home route
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        title: "Today",
        foundItems: foundItems,
        placeholder: " Create new todo. . ."
      });
    }
  });
});

//Custom List
app.get("/:customListName", function(req, res) {
  const customListName = req.params.customListName;
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!foundList) {
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
      newList.save(function(err) {
        if (!err) {
          res.redirect("/" + customListName);
        }
      });

    } else {
      res.render("list", {
        title: foundList.name,
        foundItems: foundList.items,
        placeholder: " Create new todo. . ."
      });
    }
  });
});

//Post action for Home & Custom route
app.post("/", function(req, res) {
  const listName = req.body.button;
  const itemName = new Item({
    name: req.body.newItem
  });
  if (listName === "Today") {
    itemName.save(function(err) {
      if (!err) {
        res.redirect("/");
      }
    });

  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(itemName);
      foundList.save(function(err) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });

    });
  }
});

//Delete action for Home, custom & List routes
app.post("/delete", function(req, res) {
  const itemTodeletefromList = req.body.listName;
  const idToDelete = req.body.idToDelete;

  if (itemTodeletefromList === "Today") {
    Item.findByIdAndRemove({
      _id: idToDelete
    }, function(err) {
      if (!err) {
        console.log("Checked item was successfully deleted");
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else if (itemTodeletefromList === "All Lists") {
    console.log(req.body.idToDelete);
    List.findByIdAndRemove({
      _id: idToDelete
    }, function(err) {
      if (!err) {
        console.log("Successfully deleted selected List");
        res.redirect("/lists/allLists");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate({
      name: itemTodeletefromList
    }, {
      $pull: {
        items: {
          _id: idToDelete
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + itemTodeletefromList);
      }
    });

  }
});

//Action for All Lists route
app.get("/lists/allLists", function(req, res) {
  List.find({}, function(err, foundAllLists) {
    if (!err) {
      res.render("list", {
        title: "All Lists",
        foundItems: foundAllLists,
        placeholder: " Create new List"
      });
    }
  });
});

app.post("/lists/allLists", function(req, res) {
  const newListFromMainList = req.body.newItem;
  List.findOne({
    name: newListFromMainList
  }, function(err, foundList) {
    if (!foundList) {
      const newList = new List({
        name: newListFromMainList,
        items: defaultItems
      });
      newList.save(function(err) {
        if (!err) {
          res.redirect("/" + newListFromMainList);
        }
      });

    } else {
      res.render("list", {
        title: foundList.name,
        foundItems: foundList.items,
        placeholder: " Create new todo. . ."
      });
    }
  });
});

//Running server on Port 3000
app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
