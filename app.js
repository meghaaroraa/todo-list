//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://meghaarora2003:f4dL5qV4q90RzfIR@cluster0.hj2lro3.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "welcome to the todo list"
});

const item2 = new Item({
  name: "use + to add new item"
});

const item3 = new Item({
  name: "use - to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

async function getItems(){
  const Items = await Item.find({});
  return Items;
}

const day = date.getDate();

app.get("/", function(req, res) {

  getItems().then(function(foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(function(){
          console.log("Successfully saved into our DB.");
        })
        .catch(function(err){
          console.log(err);
        });
      
      res.redirect("/");
    }

    else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
    
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then(function(foundName){
      if(!foundName){
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        console.log("list added successfully");

        res.redirect("/" + customListName);
      }

      else{
        console.log("list already exists");

        res.render("list", {listTitle: foundName.name, newListItems: foundName.items});
      }
    })

    .catch(function(err){
      console.log(err);
    })

})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === day){
    item.save();
    res.redirect("/");
  }

  else{
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }  
});

app.post("/delete", function(req, res){
  const checkedListName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if(checkedListName === day){
    del().catch(err => console.log(err));

    async function del(){
      await Item.deleteOne({_id: checkedItemId});
      res.redirect("/");
    }
  } 
  
  else{
    update().catch(err => console.log(err));

    async function update(){
      await List.findOneAndUpdate({name: checkedListName}, {$pull: {items: {_id: checkedItemId}}});
      res.redirect("/" + checkedListName);
    }
  }

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
