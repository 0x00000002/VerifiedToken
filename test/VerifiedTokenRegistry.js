import EVMThrow from './helpers/EVMThrow';
import { toUtf8 } from './helpers/asciiConverter';
const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const Registry = artifacts.require('VerifiedTokenRegistryMock');


contract('VerifiedTokenRegistry.sol', function ([deployer, registry, stranger, lawful, dartVeider]) {

    before(async function () {
        this.registry = await Registry.new();
    });

    describe('isKeyExist()', function () {

        it('should return TRUE if key is exist', async function () {
            (await this.registry.isKeyExist("some key")).should.be.false;
        });

    });

    describe('addNewKey()', function () {

        it('should return true on adding new key', async function () {
            (await this.registry.isKeyExist("new key")).should.be.false;
            await this.registry.testAddNewKey("new key").should.be.fulfilled;
            (await this.registry.isKeyExist("new key")).should.be.true;
        });

    });

    describe('updateAddress()', function () {

        it('should add a new key if it does not exist yet', async function () {
            (await this.registry.isKeyExist("age group")).should.be.false;
            await this.registry.updateAddress(lawful, "age group", "10+").should.be.fulfilled;
            (await this.registry.isKeyExist("age group")).should.be.true;
        });

        it('should update record', async function () {
            await this.registry.updateAddress(lawful, "age group", "18+").should.be.fulfilled;
            (await this.registry.verifyAddress(lawful, "age group", "18+")).should.be.true;
        });

        it('should fire an event', async function () {
            const {logs} = await this.registry.updateAddress(lawful, "id type", "passport").should.be.fulfilled;
            const event = logs.find(e => e.event === 'AddressUpdated');
            should.exist(event);
            let registryValue = web3.fromAscii(toUtf8(event.args.registry.replace(/\u0000/g, '')));
            let receiverValue = web3.fromAscii(toUtf8(event.args.receiver.replace(/\u0000/g, '')));
            registryValue.should.equal(this.registry.address.toString());
            receiverValue.should.equal(lawful.toString());
            toUtf8(event.args.key).should.equal("id type");
            toUtf8(event.args.value).should.equal("passport");
        });

    });

    describe('verifyAddress()', function () {

        it('should return TRUE if address was found', async function () {
            (await this.registry.verifyAddress(lawful, "age group", "18+")).should.be.true;
        });

        it('should return FALSE if ADDRESS was not found', async function () {
            (await this.registry.verifyAddress(stranger, "age group", "18+")).should.be.false;
        });

        it('should return FALSE if address was NOT found in the KEY => VALUE pair', async function () {
            (await this.registry.verifyAddress(lawful, "age group", "30")).should.be.false;
        });

    });

    describe('deleteAddress()', function () {

        it('should fire an event', async function () {
            const {logs} = await this.registry.deleteAddress(lawful).should.be.fulfilled;
            const event = logs.find(e => e.event === 'AddressDeleted');
            should.exist(event);
            let registryValue = web3.fromAscii(toUtf8(event.args.registry.replace(/\u0000/g, '')));
            let receiverValue = web3.fromAscii(toUtf8(event.args.receiver.replace(/\u0000/g, '')));
            registryValue.should.equal(this.registry.address.toString());
            receiverValue.should.equal(lawful.toString());
        });

        it('record should be deleted', async function () {
            (await this.registry.verifyAddress(lawful, "id type", "passport")).should.be.false;
        });


    });

    describe('exposeAddress()', function () {

      it('should return key=>value pairs for given address', async function () {
        await this.registry.updateAddress(dartVeider, "Side", "Dark").should.be.fulfilled;
        await this.registry.updateAddress(dartVeider, "Has son", "yes").should.be.fulfilled;
        let result = await this.registry.exposeAddress(dartVeider);
        let pairs = [];

        for (let i = 0; i < result[0].length; i++) {
          let pair = {
            key:  result[0][i],
            value: result[1][i],
          }
          pairs.push(pair)
        }

        expect(pairs.length).to.be.equal(2);
        expect(toUtf8(pairs[0].key)).to.be.equal("Side");
        expect(toUtf8(pairs[0].value)).to.be.equal("Dark");
        expect(toUtf8(pairs[1].key)).to.be.equal("Has son");
        expect(toUtf8(pairs[1].value)).to.be.equal("yes");
      });

    });

});