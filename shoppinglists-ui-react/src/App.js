import React, { Component } from 'react';
import { HubConnectionBuilder } from '@aspnet/signalr';
import axios from 'axios';
import {Grid, Row, Col} from 'react-bootstrap';
import logo from './logo.svg';
import './App.css';
import ListContainer from './components/ListContainer';
import MainList from './components/MainList';

class App extends Component {
  
  constructor(props){
    super(props);

    this.state = {
      allLists: [],
      selectedList: null,
      hubConnection: null,
    }
  }

  addList(){
    this.setState({
      selectedList: { name: "New Shopping List"}
    })
  }

  selectList(list){
    const  _this = this;
    axios.get('http://localhost:18111/api/shoppingLists/' + list.id)
    .then(function(response) {
      _this.setState(
        {
          selectedList: response.data,
          selectedListItems: response.data.items
        }
      );
    });
  }

  saveListName(name){
    const list = this.state.selectedList;
    list.name= name;
    if (list.id >= 0){
      axios.put('http://localhost:18111/api/shoppingLists/' + list.id, list)
      .then(function(response) {
        
      });
    }
    else{
      axios.post('http://localhost:18111/api/shoppingLists', list)
      .then(function(response) {
      });
    }    
  }

  addItem(item){
    const _this = this;
    const list = this.state.selectedList;
    const itemToAdd = {name: item, purchased: false};

    axios.post('http://localhost:18111/api/shoppingLists/'+ list.id+ '/Items', itemToAdd)
    .then(function(response) {
      list.items.push(response.data);
      _this.setState({
        selectedList: list
      });
    });
  }
  
  saveItem(item){
    const _this = this;
    const list = this.state.selectedList;
    axios.put('http://localhost:18111/api/shoppingLists/'+ list.id+ '/Items/' + item.id, item)
    .then(function(response){
      const list =  _this.state.selectedList;      
      const index = list.items.findIndex(i => i.id === item.id);
      list.items.splice(index, 1, item);
      _this.setState({
        selectedList: list
      });
    });
    
  }

  refreshLists(){
    const  _this = this;
      axios.get('http://localhost:18111/api/shoppingLists')
          .then(function(response) {
            _this.setState(
              {
                allLists: response.data
              }
            );
          });
  }
  
  componentDidMount(){

    const _this = this;

    const hubConnection = new HubConnectionBuilder()
    .withUrl("http://localhost:18111/hubs/shoppingLists")
    .build();

    this.setState({hubConnection }, () => {
      this.state.hubConnection.start()
      .then(() => console.log("Connected"))
      .catch(e => console.log("Error connecting"));
      
      this.state.hubConnection.on('ShoppingLists_Refresh', () => {
        _this.refreshLists();
      });

      this.state.hubConnection.on('ShoppingListItem_Added', (item) => {
        _this.state.selectedListItems.push(item);
        console.log("Item Added: " + item.name);
      });

      this.state.hubConnection.on('ShoppingListItem_Removed', () => {
        console.log("Item Removed")
      });

      this.state.hubConnection.on('ShoppingList_Updated', (list) => {
        
        console.log("Refresh List");
        _this.setState(
            {
              selectedList: list
            }
          );
        });
    });
  
    this.refreshLists();
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.selectedList !== this.state.selectedList ) {
        if (this.state.selectedList !== undefined && this.state.selectedList !== null)
          this.state.hubConnection.invoke('LeaveList', this.state.selectedList.id);
      if (nextState.selectedList !== undefined && nextState.selectedList !== null) {
        this.state.hubConnection.invoke('JoinList', nextState.selectedList.id);
      }
    }
  }


  render() {
    return (
      <div className="App container">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div className="App-intro">
        <Grid>
          <Row className="show-grid">
            <Col md={3} >
                <MainList lists={this.state.allLists} selectList={(list)=> this.selectList(list)} addList={()=> this.addList()}></MainList>
          </Col>
          <Col md={8}>
          { this.state.selectedList && 
            <ListContainer 
              name={this.state.selectedList.name} 
              items={this.state.selectedListItems}
              updateName={(name) => this.saveListName(name)} 
              addItem={(item) => this.addItem(item)}
              updateItem={(item) => this.saveItem(item)}></ListContainer>
          }
          </Col>
          </Row>
          </Grid>
        </div>
      </div>
    );
  }

}

export default App;
