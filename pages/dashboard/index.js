import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import { contractABI, contractAddress } from "../../contract";
import  Web3 from 'web3';


function Dashboard() {
  const web3 = new Web3(Web3.givenProvider);
  const { isAuthenticated, logout, user } = useMoralis();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const router = useRouter();
  const onSubmit = async (e) => {
    e.preventDefault();
  try {
    // Attempt to save image to IPFS
    const file1 = new Moralis.File(file.name, file);
    await file1.saveIPFS();
    const file1url = file1.ipfs();
    // Generate metadata and save to IPFS
    const metadata = {
      name,
      description,
      image: file1url,
    };
    const file2 = new Moralis.File(`${name}metadata.json`, {
      base64: Buffer.from(JSON.stringify(metadata)).toString("base64"),
    });
    await file2.saveIPFS();
    const metadataurl = file2.ipfs();
    // Interact with smart contract
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    const response = await contract.methods
      .mint(metadataurl)
      .send({ from: user.get("ethAddress") });
    // Get token id
    const tokenId = response.events.Transfer.returnValues.tokenId;
    // Display alert
    alert(
      `NFT successfully minted. Contract address - ${contractAddress} and Token ID - ${tokenId}`
    );
  } catch (err) {
    console.error(err);
    alert("An error occured!");
  }
  };
  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated]);
  return (
    <div className="flex w-screen h-screen items-center justify-center">
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="text"
            className="border-[1px] p-2 text-lg border-black w-full"
            value={name}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <input
            type="text"
            className="border-[1px] p-2 text-lg border-black w-full"
            value={description}
            placeholder="Description"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <input
            type="file"
            className="border-[1px] p-2 text-lg border-black"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button
          type="submit"
          className="mt-5 w-full p-5 bg-green-700 text-white text-lg rounded-xl animate-pulse"
        >
          Mint now!
        </button>
        <button
          onClick={logout}
          className="mt-5 w-full p-5 bg-red-700 text-white text-lg rounded-xl"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
export default Dashboard;