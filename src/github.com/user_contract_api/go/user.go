package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type User struct {
	Name	string `json:"name"`
	Email	string `json:"email"`
	Age		string `json:"age"`
	Gender	string `json:"gender"`
}

type QueryResult struct {
	Key    string `json:"Key"`
	Record *User
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	users := []User{
		User{Name: "Harsha", Email: "har@gmail.com", Age: "21", Gender: "Male"},
		User{Name: "Kiran", Email: "kir@gmail.com", Age: "22", Gender: "Male"},
	}

	for i, user := range users {
		userAsBytes, _ := json.Marshal(user)
		err := ctx.GetStub().PutState("USER"+strconv.Itoa(i), userAsBytes)

		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	return nil
}

func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, name string, email string, age string, gender string) error {
	user := User{
		Name:   name,
		Email:  email,
		Age: age,
		Gender:  gender,
	}

	userAsBytes, _ := json.Marshal(user)

	return ctx.GetStub().PutState(name, userAsBytes)
}

func (s *SmartContract) QueryUser(ctx contractapi.TransactionContextInterface, name string) (*User, error) {
	userAsBytes, err := ctx.GetStub().GetState(name)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if userAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", name)
	}

	user := new(User)
	_ = json.Unmarshal(userAsBytes, user)

	return user, nil
}

func (s *SmartContract) QueryAllUsers(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {
	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []QueryResult{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		user := new(User)
		_ = json.Unmarshal(queryResponse.Value, user)

		queryResult := QueryResult{Key: queryResponse.Key, Record: user}
		results = append(results, queryResult)
	}

	return results, nil
}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error create user chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting user chaincode: %s", err.Error())
	}
}
