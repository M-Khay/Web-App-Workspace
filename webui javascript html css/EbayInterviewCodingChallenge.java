Problem statement - Library dependency for apps are provided. 

eBayApps -> eBayPayApps, JShared
JWGroup -> TxnGroup, JShared
JShared -> ebaySharedApps
ebaySharedApps -> SEShared, Core
eBayPayApps -> ebaySharedApps, ALib
TxnGroup -> ebaySharedApps, WLib

Provided an app name get all the dependencies example. 

eBayApps -- > eBayPayAps , JShared, ebayShareApps, ALib, SEShared, Core

class LibrarDependencyList{
queue<String> appName   exmple data -> {eBayApps, JWGroup,JShared,ebaySharedApps,TxnGroup)
Static ArrayList<String> finalListInOrder;
List(Map<String,ArrayList<String>)
Map<String, ArrayList<String>> libraryDependencies;
ArrayList<String> dependencyLibrariesList;
boolean appPresentInList;
int appPositioninList;
pubilc void setLibraryDependecyList(List<String,ArrayList<String> libraryDependencies){
this.libraryDependencies =  libraryDependencies;
}

private void printDependecyListInOrder(String appName){


if(libraryDependencies.contains(appName))
   {
  dependencyLibrariesList = libraryDependencies.get(appName);
  finalListOrder.add(dependencyLibraryList);   // adds "eBayPayApps", "JShared" into finalListInOrder arrayList
   }
}else{
return;
}

int size= appName.size();

for(int i =0; i<size;i++)  // dependencyLibraryList = { eBayPayApps, JShared}
{
String appNameTemp = appName.pop();
if(appNameTemp.equals(appName)
{
}
else{

if(dependencyLibraryList.contains(appNameTemp)){
printDependencyListInOrder(appNameTemp)
}


}




}



}

